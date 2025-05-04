import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import pkg from "handlebars";
import { launch } from "puppeteer";
import { getCurrentDate } from "./utils.js";

const generateResumes = async (argv) => {
  try {
    const resumeData = getResumeData(argv);
    const templatePath = getTemplatePath(argv, resumeData);

    ensureTemplateExists(templatePath);

    const outputDir = getOrCreateOutputDirectory(argv.output);
    const languages = getLanguagesToGenerate(argv, resumeData);

    ensureAtLeastOneLanguageIsSpecified(languages);

    const context = { resumeData, templatePath, outputDir, argv };
    await Promise.all(
      languages.map((language) =>
        generateResumeForLanguage(context, language))
    );

    console.log("\nResume generation completed successfully! 🚀");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default {
  generateResumes
};

function getResumeData(argv) {
  return JSON.parse(readFileSync(argv.data, "utf8"));
}

function getTemplatePath(argv, resumeData) {
  const templateName = argv.template || resumeData.metadata?.template || "default";

  return resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);
}

function ensureTemplateExists(templatePath) {
  if (!existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    process.exit(1);
  }
}

function getOrCreateOutputDirectory(dirName) {
  const outputDir = resolve(process.cwd(), dirName);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

function getLanguagesToGenerate(argv, resumeData) {
  return argv.language ? [argv.language] : resumeData.languages;
}

function ensureAtLeastOneLanguageIsSpecified(languages) {
  if (!languages || languages.length === 0) {
    console.error("No languages specified in resume data or via command line");
    process.exit(1);
  }
}

async function generateResumeForLanguage(context, language) {
  const { resumeData, templatePath, outputDir, argv } = context;
  const currentDate = getCurrentDate();

  const baseFileName = `${currentDate}-${language}-${resumeData.basic.name.toLowerCase().replace(/\s+/g, "-")}`;
  const html = generateHTML(resumeData, language, templatePath);
  const htmlPath = join(outputDir, `${baseFileName}.html`);
  saveHTML(html, htmlPath);

  if (!argv.htmlOnly) {
    const pdfPath = join(outputDir, `${baseFileName}.pdf`);
    await generatePDF(htmlPath, pdfPath);
  }

  if (!argv.html && !argv.htmlOnly) {
    unlinkSync(htmlPath);
  }
}

function generateHTML(data, language, templatePath) {
  try {
    const templateSource = readFileSync(templatePath, "utf8");
    const compiledTemplate = pkg.compile(templateSource);

    return compiledTemplate({
      ...data,
      language
    });
  } catch (error) {
    console.error(`Error generating HTML: ${error.message}`);
    process.exit(1);
  }
}

function saveHTML(html, outputPath) {
  try {
    writeFileSync(outputPath, html);
    console.log(`HTML saved: ${outputPath}`);
  } catch (error) {
    console.error(`Error saving HTML: ${error.message}`);
    process.exit(1);
  }
}

async function generatePDF(htmlPath, outputPath) {
  try {
    const browser = await launch();
    const page = await browser.newPage();

    // To work both on Windows and Linux
    const absoluteHtmlPath = `file://${resolve(htmlPath)}`;

    await page.goto(absoluteHtmlPath, {
      waitUntil: "networkidle0"
    });

    if (!(await isValidHeight(page))) {
      console.error("Content height exceeds A4 threshold. PDF generation aborted.");
      return await browser.close();
    }

    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    await browser.close();
    console.log(`PDF generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
    process.exit(1);
  }
}

async function isValidHeight(page) {
  const A4_HEIGHT_PX = 1123;

  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".resume-container");
    if (!container) {
      console.warn("Resume container not found, using body height");
      return document.body.scrollHeight;
    }
    return container.scrollHeight;
  });

  const isHeightValid = contentHeight <= A4_HEIGHT_PX;

  if (!isHeightValid) {
    console.log(`Content height (${contentHeight}px) exceeds A4 maximum (${A4_HEIGHT_PX}px)`);
  }

  return isHeightValid;
}

export {
  ensureAtLeastOneLanguageIsSpecified,
  isValidHeight,
  getResumeData,
  getTemplatePath,
  getLanguagesToGenerate
};
