import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { registerHelpers } from './template.js';
import {
  getCurrentDate,
  generateHTML,
  generatePDF,
  saveHTML
} from './utils.js';

async function forgeResumes(argv) {
  try {
    registerHelpers();

    const resumeData = JSON.parse(readFileSync(argv.data, 'utf8'));

    const templatePath = getTemplatePath(argv, resumeData);

    ensureTemplateExists(templatePath);

    const outputDir = getOrCreateOutputDirectory(argv.output);

    const languages = getLanguageToGenerate(argv, resumeData);

    ensureLanguageIsSpecified(languages);

    const currentDate = getCurrentDate();

    for (const language of languages) {
      const baseFileName = `${resumeData.basic.name.toLowerCase().replace(/\s+/g, '-')}-${language}-${currentDate}`;

      const html = generateHTML(resumeData, language, templatePath);

      if (argv.html) {
        const htmlPath = join(outputDir, `${baseFileName}.html`);
        saveHTML(html, htmlPath);
      }

      if (!argv.htmlOnly) {
        const pdfPath = join(outputDir, `${baseFileName}.pdf`);
        await generatePDF(html, pdfPath);
      }
    }

    console.log('\nResume generation completed successfully! 🚀');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

const getTemplatePath = (argv, resumeData) => {
  const templateName = argv.template || resumeData.metadata?.template || 'default';

  return resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);
};

const ensureTemplateExists = (templatePath) => {
  if (!existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    process.exit(1);
  }
};

const getOrCreateOutputDirectory = (dirName) => {
  const outputDir = dirName.resolve(process.cwd(), dirName);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
};

const getLanguageToGenerate = (argv, resumeData) => (argv.language ? [argv.language] : resumeData.languages);

const ensureLanguageIsSpecified = (languages) => {
  if (!languages || languages.length === 0) {
    console.error('No languages specified in resume data or via command line');
    process.exit(1);
  }
};

export default {
  forgeResumes
};
