import { resolve, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdir } from "fs";
import Handlebars from "handlebars";
import { launch } from "puppeteer";
import spellChecker from "./spell-checker.js";

// Types
interface ResumeData {
  basic: { name: string; [key: string]: any };
  metadata?: { template?: string; [key: string]: any };
  languages: string[];
  [key: string]: any;
}

interface CommandLineArgs {
  data: string;
  template?: string;
  templatesDir: string;
  output: string;
  language?: string;
  html?: boolean;
  htmlOnly?: boolean;
  noSpellCheck?: boolean;
  [key: string]: any;
}

// Constants
const A4_HEIGHT_PX = 1123;

// Utility functions
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function readJSON(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function log(message: string): void {
  console.log(message);
}

function error(message: string): void {
  console.error(message);
}

function warn(message: string): void {
  console.warn(message);
}

// Register Handlebars helpers
function setupHandlebars(): void {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("join", (array, separator) => array.join(separator));
  Handlebars.registerHelper("getIcon", (type) => {
    switch (type) {
      case "email":
        return "mail-outline";
      case "phone":
        return "call-outline";
      case "github":
        return "logo-github";
      case "linkedin":
        return "logo-linkedin";
      case "location":
        return "location-outline";
      default:
        return "";
    }
  });
  Handlebars.registerHelper("lookup", (obj, field, subfield) => {
    if (!obj || !field) return "";
    if (typeof subfield === "string") return obj[field][subfield];
    return obj[field] !== undefined ? obj[field] : obj;
  });
}

// HTML Generation
function generateHTML(data: ResumeData, language: string, templatePath: string): string {
  const templateSource = readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateSource);
  return template({ ...data, language });
}

// PDF Generation
async function generatePDF(htmlPath: string, outputPath: string): Promise<void> {
  const browser = await launch();
  const page = await browser.newPage();

  const absoluteHtmlPath = `file://${resolve(htmlPath)}`;
  await page.goto(absoluteHtmlPath, { waitUntil: "networkidle0" });

  // Validate height
  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".resume-container");
    if (!container) {
      console.warn("Resume container not found, using body height");
      return document.body.scrollHeight;
    }
    return container.scrollHeight;
  });

  if (contentHeight > A4_HEIGHT_PX) {
    console.log(`Content height (${contentHeight}px) exceeds A4 maximum (${A4_HEIGHT_PX}px)`);
    error("Content height exceeds A4 threshold. PDF generation aborted.");
    await browser.close();
    return;
  }

  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: { top: "0", right: "0", bottom: "0", left: "0" }
  });

  await browser.close();
  log(`PDF generated: ${outputPath}`);
}

// Spell checking
async function spellCheckHTML(html: string, language: string): Promise<void> {
  const result = await spellChecker.spellCheckHtml(html, language);

  if (result.misspelledCount > 0) {
    warn(`Found ${result.misspelledCount} misspelled words in '${language}' resume:`);
    result.misspelled.forEach(({ word, suggestions }) => {
      warn(`- "${word}" -> Suggestions: ${suggestions.join(", ")}`);
    });
  } else {
    log(`✓ No spelling errors found in ${language} resume`);
  }
}

// Main resume generation logic
async function generateResumeForLanguage(
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

  const html = generateHTML(resumeData, language, templatePath);
  const htmlPath = join(outputDir, `${baseFileName}.html`);

  if (!argv.noSpellCheck) {
    await spellCheckHTML(html, language);
  }

  writeFileSync(htmlPath, html);
  log(`HTML saved: ${htmlPath}`);

  if (!argv.htmlOnly) {
    const pdfPath = join(outputDir, `${baseFileName}.pdf`);
    await generatePDF(htmlPath, pdfPath);
  }

  if (!argv.html && !argv.htmlOnly) {
    unlinkSync(htmlPath);
  }
}

// Main generator function
export async function generateResumes(argv: CommandLineArgs): Promise<void> {
  try {
    // Setup
    setupHandlebars();

    // Read resume data
    const resumeData: ResumeData = readJSON(argv.data);

    // Get template path
    const templateName = argv.template || resumeData.metadata?.template || "default";
    const templatePath = resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);

    // Validate template exists
    if (!existsSync(templatePath)) {
      error(`Template not found: ${templatePath}`);
      process.exit(1);
    }

    // Create output directory
    const outputDir = resolve(process.cwd(), argv.output);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Determine languages
    const languages = argv.language ? [argv.language] : resumeData.languages;
    if (!languages || languages.length === 0) {
      error("No languages specified in resume data or via command line");
      process.exit(1);
    }

    // Generate resumes for all languages
    await Promise.all(
      languages.map((language) =>
        generateResumeForLanguage(resumeData, templatePath, outputDir, argv, language)
      )
    );

    log("\nResume generation completed successfully! 🚀");
  } catch (err) {
    error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export default { generateResumes };

