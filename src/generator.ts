import { resolve, join } from "path";
import Handlebars from "handlebars";
import { launch } from "puppeteer";
import { getCurrentDate, createFileOperations, createLogger } from "./utils.js";
import spellChecker from "./spell-checker.js";
import type {
  GeneratorConfig,
  ResumeData,
  CommandLineArgs,
  SpellCheckResult
} from "./models.js";

const defaultConfig: GeneratorConfig = {
  A4_HEIGHT_PX: 1123,
  DATE_FORMAT: "YYYYMMDD"
};

class HTMLGenerator {
  private fileOps = createFileOperations();

  constructor() {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper("eq", (a, b) => a === b);
    Handlebars.registerHelper("join", (array, separator) => array.join(separator));
    Handlebars.registerHelper("getIcon", (type) => {
      switch (type) {
        case "email": return "mail-outline";
        case "phone": return "call-outline";
        case "github": return "logo-github";
        case "linkedin": return "logo-linkedin";
        case "location": return "location-outline";
        default: return "";
      }
    });
    Handlebars.registerHelper("lookup", (obj, field, subfield) => {
      if (!obj || !field) return "";
      if (typeof subfield === "string") return obj[field][subfield];
      return obj[field] !== undefined ? obj[field] : obj;
    });
  }

  generate(data: ResumeData, language: string, templatePath: string): string {
    const templateSource = this.fileOps.readFile(templatePath);
    const template = Handlebars.compile(templateSource);
    return template({ ...data, language });
  }
}

class PDFGenerator {
  constructor(private config: GeneratorConfig = defaultConfig) {}

  async generate(htmlPath: string, outputPath: string): Promise<void> {
    const browser = await launch();
    const page = await browser.newPage();

    const absoluteHtmlPath = `file://${resolve(htmlPath)}`;
    await page.goto(absoluteHtmlPath, { waitUntil: "networkidle0" });

    const isValid = await this.isValidHeight(page);
    if (!isValid) {
      console.error("Content height exceeds A4 threshold. PDF generation aborted.");
      await browser.close();
      return;
    }

    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    await browser.close();
    console.log(`PDF generated: ${outputPath}`);
  }

  private async isValidHeight(page: any): Promise<boolean> {
    const contentHeight = await page.evaluate(() => {
      const container = document.querySelector(".resume-container");
      if (!container) {
        console.warn("Resume container not found, using body height");
        return document.body.scrollHeight;
      }
      return container.scrollHeight;
    });

    const isHeightValid = contentHeight <= this.config.A4_HEIGHT_PX;

    if (!isHeightValid) {
      console.log(
        `Content height (${contentHeight}px) exceeds A4 maximum (${this.config.A4_HEIGHT_PX}px)`
      );
    }

    return isHeightValid;
  }
}

export class ResumeGenerator {
  private fileOps = createFileOperations();
  private logger = createLogger();
  private htmlGenerator = new HTMLGenerator();
  private pdfGenerator = new PDFGenerator();

  async generateResumes(argv: CommandLineArgs): Promise<void> {
    try {
      const resumeData = this.getResumeData(argv.data);
      const templatePath = this.getTemplatePath(argv, resumeData);

      this.ensureTemplateExists(templatePath);

      const outputDir = this.getOrCreateOutputDirectory(argv.output);
      const languages = this.getLanguagesToGenerate(argv, resumeData);

      this.ensureAtLeastOneLanguageIsSpecified(languages);

      await Promise.all(
        languages.map((language) =>
          this.generateResumeForLanguage(resumeData, templatePath, outputDir, argv, language)
        )
      );

      this.logger.log("\nResume generation completed successfully! 🚀");
    } catch (error) {
      this.logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private getResumeData(dataPath: string): ResumeData {
    return this.fileOps.readJSON(dataPath);
  }

  private getTemplatePath(argv: CommandLineArgs, resumeData: ResumeData): string {
    const templateName = argv.template || resumeData.metadata?.template || "default";
    return resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);
  }

  private ensureTemplateExists(templatePath: string): void {
    if (!this.fileOps.exists(templatePath)) {
      this.logger.error(`Template not found: ${templatePath}`);
      process.exit(1);
    }
  }

  private getOrCreateOutputDirectory(dirName: string): string {
    const outputDir = resolve(process.cwd(), dirName);

    if (!this.fileOps.exists(outputDir)) {
      this.fileOps.createDir(outputDir);
    }

    return outputDir;
  }

  private getLanguagesToGenerate(argv: CommandLineArgs, resumeData: ResumeData): string[] {
    return argv.language ? [argv.language] : resumeData.languages;
  }

  private ensureAtLeastOneLanguageIsSpecified(languages: string[]): void {
    if (!languages || languages.length === 0) {
      this.logger.error("No languages specified in resume data or via command line");
      process.exit(1);
    }
  }

  private async spellCheckHtml(html: string, language: string): Promise<void> {
    const spellCheckResult: SpellCheckResult = await spellChecker.spellCheckHtml(html, language);

    if (spellCheckResult.misspelledCount > 0) {
      this.logger.warn(
        `Found ${spellCheckResult.misspelledCount} misspelled words in '${language}' resume:`
      );
      spellCheckResult.misspelled.forEach(({ word, suggestions }) => {
        this.logger.warn(`- "${word}" -> Suggestions: ${suggestions.join(", ")}`);
      });
    } else {
      this.logger.log(`✓ No spelling errors found in ${language} resume`);
    }
  }

  private async generateResumeForLanguage(
    resumeData: ResumeData,
    templatePath: string,
    outputDir: string,
    argv: CommandLineArgs,
    language: string
  ): Promise<void> {
    const currentDate = getCurrentDate();
    const baseFileName = `${currentDate}-${language}-${resumeData.basic.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}`;

    const html = this.htmlGenerator.generate(resumeData, language, templatePath);
    const htmlPath = join(outputDir, `${baseFileName}.html`);

    if (!argv.noSpellCheck) {
      await this.spellCheckHtml(html, language);
    }

    this.fileOps.writeFile(htmlPath, html);
    this.logger.log(`HTML saved: ${htmlPath}`);

    if (!argv.htmlOnly) {
      const pdfPath = join(outputDir, `${baseFileName}.pdf`);
      await this.pdfGenerator.generate(htmlPath, pdfPath);
    }

    if (!argv.html && !argv.htmlOnly) {
      this.fileOps.deleteFile(htmlPath);
    }
  }
}

// Create a default instance for backward compatibility
const defaultGenerator = new ResumeGenerator();

export default defaultGenerator;
export { defaultGenerator as generator };