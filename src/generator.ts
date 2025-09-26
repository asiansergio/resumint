import { resolve, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import Handlebars from "handlebars";
import { Browser, launch } from "puppeteer";
import spellChecker from "./spell-checker.js";
import { ResumeData, CommandLineArgs, GenerationResult } from "./models/generator.js";
import { getCurrentDate, getErrorMessage, Timer } from "./utils.js";

const A4_HEIGHT_PX = 1123;

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

async function generatePDF(
  browser: Browser,
  htmlPath: string,
  outputPath: string,
  generationResult: GenerationResult
) {
  const page = await browser.newPage();

  const absoluteHtmlPath = `file://${resolve(htmlPath)}`;
  await page.goto(absoluteHtmlPath, { waitUntil: "networkidle0" });

  // Validate height
  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".resume-container");
    if (!container) {
      generationResult.logs.push("[Warrn]: Resume container not found, using body height");
      return document.body.scrollHeight;
    }
    return container.scrollHeight;
  });

  if (contentHeight > A4_HEIGHT_PX) {
    generationResult.logs.push(
      `[Error]: Content height (${contentHeight}px) exceeds A4 maximum (${A4_HEIGHT_PX}px)`
    );
    await browser.close();
    return;
  }

  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: { top: "0", right: "0", bottom: "0", left: "0" }
  });

  await browser.close();
  generationResult.logs.push(`[Info]: PDF generated: ${outputPath}`);
}

async function spellCheckHTML(html: string, language: string, generationResult: GenerationResult) {
  const result = await spellChecker.spellCheckHtml(html, language);

  if (result.misspelledCount > 0) {
    generationResult.logs.push(
      `[Warn]: Found ${result.misspelledCount} misspelled words in '${language}' resume:`
    );
    result.misspelled.forEach(({ word, suggestions }) => {
      generationResult.logs.push(`\t- "${word}" -> Suggestions: ${suggestions.join(", ")}`);
    });
  } else {
    generationResult.logs.push(`[Info]: No spelling errors found in ${language} resume`);
  }
}

async function generateResumeForLanguage(
  browser: Browser,
  currentDate: string,
  template: HandlebarsTemplateDelegate<any>,
  resumeData: ResumeData,
  templatePath: string,
  outputDir: string,
  argv: CommandLineArgs,
  language: string
) {
  const result: GenerationResult = {
    logs: [`\nResume lang '${language.toUpperCase()}'`]
  };

  const baseFileName = `${currentDate}-${language}-${resumeData.basic.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`;

  const html = template({ ...resumeData, language });
  const htmlPath = join(outputDir, `${baseFileName}.html`);

  let spellCheckPromise;
  if (!argv.noSpellCheck) {
    spellCheckPromise = spellCheckHTML(html, language, result);
  }

  writeFileSync(htmlPath, html);

  let pdfGenerationPromise;
  if (argv.htmlOnly) {
    result.logs.push(`[Info]: HTML saved: ${htmlPath}\n`);
  } else {
    const pdfPath = join(outputDir, `${baseFileName}.pdf`);
    pdfGenerationPromise = generatePDF(browser, htmlPath, pdfPath, result);
  }

  if (!argv.html && !argv.htmlOnly) {
    unlinkSync(htmlPath);
  }

  if (spellCheckPromise) {
    await spellCheckPromise;
  }

  if (pdfGenerationPromise) {
    await pdfGenerationPromise;
  }

  console.log(result.logs.join("\n"));
}

export async function generateResumes(argv: CommandLineArgs) {
  try {
    const browserLaunchPromise = launch();
    setupHandlebars();

    const resumeData: ResumeData = JSON.parse(readFileSync(argv.data, "utf8"));
    const templateName = argv.template || resumeData.metadata?.template || "default";
    const templatePath = resolve(process.cwd(), argv.templatesDir, `${templateName}-template.html`);

    if (!existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      process.exit(1);
    }

    const outputDir = resolve(process.cwd(), argv.output);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Determine languages
    const languages = argv.language ? [argv.language] : resumeData.languages;
    if (!languages || languages.length === 0) {
      console.error("No languages specified in resume data or via command line");
      process.exit(1);
    }

    const currentDate = getCurrentDate();
    const templateSource = readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateSource);
    const browser = await browserLaunchPromise;

    await Promise.all(
      languages.map((language) =>
        generateResumeForLanguage(
          browser,
          currentDate,
          template,
          resumeData,
          templatePath,
          outputDir,
          argv,
          language
        )
      )
    );

    await browser.close();
  } catch (err) {
    console.error(`Error: ${getErrorMessage(err)}`);
    process.exit(1);
  }
}

export default { generateResumes };
