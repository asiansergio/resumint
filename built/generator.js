var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { resolve, join } from "path";
import pkg from "handlebars";
import { launch } from "puppeteer";
import { getCurrentDate, createFileOperations, createLogger, withErrorHandling } from "./utils.js";
import spellChecker from "./spell-checker.js";
const defaultConfig = {
    A4_HEIGHT_PX: 1123,
    DATE_FORMAT: "YYYYMMDD"
};
const createHTMLGenerator = (handlebars = pkg, fileOps = createFileOperations()) => ({
    generate(data, language, templatePath) {
        const templateSource = fileOps.readFile(templatePath);
        const template = handlebars.compile(templateSource);
        return template(Object.assign(Object.assign({}, data), { language }));
    }
});
const createPDFGenerator = (puppeteer = { launch }, path = { resolve }, config = defaultConfig) => ({
    generate(htmlPath, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch();
            const page = yield browser.newPage();
            const absoluteHtmlPath = `file://${path.resolve(htmlPath)}`;
            yield page.goto(absoluteHtmlPath, { waitUntil: "networkidle0" });
            const isValid = yield this.isValidHeight(page);
            if (!isValid) {
                console.error("Content height exceeds A4 threshold. PDF generation aborted.");
                yield browser.close();
            }
            yield page.pdf({
                path: outputPath,
                format: "A4",
                margin: { top: "0", right: "0", bottom: "0", left: "0" }
            });
            yield browser.close();
            console.log(`PDF generated: ${outputPath}`);
        });
    },
    isValidHeight(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentHeight = yield page.evaluate(() => {
                const container = document.querySelector(".resume-container");
                if (!container) {
                    console.warn("Resume container not found, using body height");
                    return document.body.scrollHeight;
                }
                return container.scrollHeight;
            });
            const isHeightValid = contentHeight <= config.A4_HEIGHT_PX;
            if (!isHeightValid) {
                console.log(`Content height (${contentHeight}px) exceeds A4 maximum (${config.A4_HEIGHT_PX}px)`);
            }
            return isHeightValid;
        });
    }
});
const createGenerator = ({ fileOps = createFileOperations(), htmlGenerator = createHTMLGenerator(), pdfGenerator = createPDFGenerator(), spellCheckerModule = spellChecker, logger = createLogger(), path = { resolve, join }, process = global.process, utils = { getCurrentDate } } = {}) => {
    const getResumeData = (dataPath) => fileOps.readJSON(dataPath);
    const getTemplatePath = (argv, resumeData) => {
        var _a;
        const templateName = argv.template || ((_a = resumeData.metadata) === null || _a === void 0 ? void 0 : _a.template) || "default";
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
    const getLanguagesToGenerate = (argv, resumeData) => argv.language ? [argv.language] : resumeData.languages;
    const ensureAtLeastOneLanguageIsSpecified = (languages) => {
        if (!languages || languages.length === 0) {
            logger.error("No languages specified in resume data or via command line");
            process.exit(1);
        }
    };
    const spellCheckHtml = (html, language) => __awaiter(void 0, void 0, void 0, function* () {
        const spellCheckResult = yield spellCheckerModule.spellCheckHtml(html, language);
        if (spellCheckResult.misspelledCount > 0) {
            logger.warn(`Found ${spellCheckResult.misspelledCount} misspelled words in '${language}' resume:`);
            spellCheckResult.misspelled.forEach(({ word, suggestions }) => {
                logger.warn(`- "${word}" -> Suggestions: ${suggestions.join(", ")}`);
            });
        }
        else {
            logger.log(`✓ No spelling errors found in ${language} resume`);
        }
    });
    const generateResumeForLanguage = (_a, language_1) => __awaiter(void 0, [_a, language_1], void 0, function* ({ resumeData, templatePath, outputDir, argv }, language) {
        const currentDate = utils.getCurrentDate();
        const baseFileName = `${currentDate}-${language}-${resumeData.basic.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")}`;
        const html = htmlGenerator.generate(resumeData, language, templatePath);
        const htmlPath = path.join(outputDir, `${baseFileName}.html`);
        if (!argv.noSpellCheck) {
            yield spellCheckHtml(html, language);
        }
        fileOps.writeFile(htmlPath, html);
        logger.log(`HTML saved: ${htmlPath}`);
        if (!argv.htmlOnly) {
            const pdfPath = path.join(outputDir, `${baseFileName}.pdf`);
            yield pdfGenerator.generate(htmlPath, pdfPath);
        }
        if (!argv.html && !argv.htmlOnly) {
            fileOps.deleteFile(htmlPath);
        }
    });
    const generateResumes = (argv) => __awaiter(void 0, void 0, void 0, function* () {
        const resumeData = getResumeData(argv.data);
        const templatePath = getTemplatePath(argv, resumeData);
        ensureTemplateExists(templatePath);
        const outputDir = getOrCreateOutputDirectory(argv.output);
        const languages = getLanguagesToGenerate(argv, resumeData);
        ensureAtLeastOneLanguageIsSpecified(languages);
        const context = { resumeData, templatePath, outputDir, argv };
        yield Promise.all(languages.map((language) => generateResumeForLanguage(context, language)));
        logger.log("\nResume generation completed successfully! 🚀");
    });
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
export const { getResumeData, getTemplatePath, ensureTemplateExists, getOrCreateOutputDirectory, getLanguagesToGenerate, ensureAtLeastOneLanguageIsSpecified, generateResumeForLanguage, htmlGenerator, pdfGenerator } = createGenerator();
export { createGenerator };
