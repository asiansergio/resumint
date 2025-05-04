import { resolve, join } from "path";
import pkg from "handlebars";
import { launch } from "puppeteer";
import { getCurrentDate, createFileOperations, createLogger, withErrorHandling } from "./utils.js";

const defaultConfig = {
  A4_HEIGHT_PX: 1123,
  FILE_ENCODING: "utf8",
  DATE_FORMAT: "YYYYMMDD"
};

const createHTMLGenerator = (
  handlebars = pkg,
  fileOps = createFileOperations(defaultConfig.FILE_ENCODING)
) => ({
  generate(data, language, templatePath) {
    const templateSource = fileOps.readFile(templatePath);
    const template = handlebars.compile(templateSource);

    return template({
      ...data,
      language
    });
  }
});

const createPDFGenerator = (
  puppeteer = { launch },
  path = { resolve },
  config = defaultConfig
) => ({
  async generate(htmlPath, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const absoluteHtmlPath = `file://${path.resolve(htmlPath)}`;
    await page.goto(absoluteHtmlPath, { waitUntil: "networkidle0" });

    const isValid = await this.isValidHeight(page);
    if (!isValid) {
      console.error("Content height exceeds A4 threshold. PDF generation aborted.");
      await browser.close();
    }

    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    await browser.close();
    console.log(`PDF generated: ${outputPath}`);
  },

  async isValidHeight(page) {
    const contentHeight = await page.evaluate(() => {
      const container = document.querySelector(".resume-container");
      if (!container) {
        console.warn("Resume container not found, using body height");
        return document.body.scrollHeight;
      }
      return container.scrollHeight;
    });

    const isHeightValid = contentHeight <= config.A4_HEIGHT_PX;

    if (!isHeightValid) {
      console.log(
        `Content height (${contentHeight}px) exceeds A4 maximum (${config.A4_HEIGHT_PX}px)`
      );
    }

    return isHeightValid;
  }
});

const createGenerator = ({
  fileOps = createFileOperations(),
  htmlGenerator = createHTMLGenerator(),
  pdfGenerator = createPDFGenerator(),
  logger = createLogger(),
  path = { resolve, join },
  process = global.process,
  utils = { getCurrentDate }
} = {}) => {
  const getResumeData = (dataPath) => fileOps.readJSON(dataPath);

  const getTemplatePath = (argv, resumeData) => {
    const templateName = argv.template || resumeData.metadata?.template || "default";
    return path.resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);
  };

  const ensureTemplateExists = (templatePath) => {
    if (!fileOps.exists(templatePath)) {
      logger.error(`Template not found: ${templatePath}`);
      process.exit(1);
    }
  };

  const getOrCreateOutputDirectory = (dirName) => {
    const outputDir = path.resolve(process.cwd(), dirName);

    if (!fileOps.exists(outputDir)) {
      fileOps.createDir(outputDir);
    }

    return outputDir;
  };

  const getLanguagesToGenerate = (argv, resumeData) =>
    (argv.language ? [argv.language] : resumeData.languages);

  const ensureAtLeastOneLanguageIsSpecified = (languages) => {
    if (!languages || languages.length === 0) {
      logger.error("No languages specified in resume data or via command line");
      process.exit(1);
    }
  };

  const generateResumeForLanguage = async (
    { resumeData, templatePath, outputDir, argv },
    language
  ) => {
    const currentDate = utils.getCurrentDate();
    const baseFileName = `${currentDate}-${language}-${resumeData.basic.name.toLowerCase().replace(/\s+/g, "-")}`;

    const html = htmlGenerator.generate(resumeData, language, templatePath);
    const htmlPath = path.join(outputDir, `${baseFileName}.html`);

    fileOps.writeFile(htmlPath, html);
    logger.log(`HTML saved: ${htmlPath}`);

    if (!argv.htmlOnly) {
      const pdfPath = path.join(outputDir, `${baseFileName}.pdf`);
      await pdfGenerator.generate(htmlPath, pdfPath);
    }

    if (!argv.html && !argv.htmlOnly) {
      fileOps.deleteFile(htmlPath);
    }
  };

  const generateResumes = async (argv) => {
    const resumeData = getResumeData(argv.data);
    const templatePath = getTemplatePath(argv, resumeData);

    ensureTemplateExists(templatePath);

    const outputDir = getOrCreateOutputDirectory(argv.output);
    const languages = getLanguagesToGenerate(argv, resumeData);

    ensureAtLeastOneLanguageIsSpecified(languages);

    const context = { resumeData, templatePath, outputDir, argv };
    await Promise.all(languages.map((language) => generateResumeForLanguage(context, language)));

    logger.log("\nResume generation completed successfully! 🚀");
  };

  return {
    generateResumes: withErrorHandling(generateResumes, logger, process),
    getResumeData,
    getTemplatePath,
    ensureTemplateExists,
    getOrCreateOutputDirectory,
    getLanguagesToGenerate,
    ensureAtLeastOneLanguageIsSpecified,
    generateResumeForLanguage,
    htmlGenerator,
    pdfGenerator
  };
};

export default createGenerator();

export const {
  getResumeData,
  getTemplatePath,
  ensureTemplateExists,
  getOrCreateOutputDirectory,
  getLanguagesToGenerate,
  ensureAtLeastOneLanguageIsSpecified,
  generateResumeForLanguage,
  htmlGenerator,
  pdfGenerator
} = createGenerator();

export { createGenerator };
