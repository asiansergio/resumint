import {
  readFileSync, existsSync, mkdirSync, unlinkSync
} from "fs";
import { resolve, join } from "path";
import template from "./template.js";
import {
  getCurrentDate, generateHTML, generatePDF, saveHTML
} from "./utils.js";

const forgeResumes = async (argv) => {
  try {
    template.registerHelpers();

    const resumeData = JSON.parse(readFileSync(argv.data, "utf8"));

    const templatePath = getTemplatePath(argv, resumeData);

    ensureTemplateExists(templatePath);

    const outputDir = getOrCreateOutputDirectory(argv.output);

    const languages = getLanguageToGenerate(argv, resumeData);

    ensureLanguageIsSpecified(languages);

    const currentDate = getCurrentDate();

    await Promise.all(
      languages.map(async (language) => {
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
      })
    );

    console.log("\nResume generation completed successfully! 🚀");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

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

function getLanguageToGenerate(argv, resumeData) {
  return argv.language ? [argv.language] : resumeData.languages;
}

function ensureLanguageIsSpecified(languages) {
  if (!languages || languages.length === 0) {
    console.error("No languages specified in resume data or via command line");
    process.exit(1);
  }
}

export default {
  forgeResumes
};
