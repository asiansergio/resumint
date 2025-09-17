var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import nspell from "nspell";
import path from "path";
import { createFileOperations } from "./utils.js";
const defaultConfig = {
    DICTIONARIES_DIR: "dictionaries",
    WHITELIST_DIR: "whitelist",
    MAX_SUGGESTIONS: 5
};
const createTextProcessor = () => ({
    extractTextFromHtml(html) {
        const cleanedHtml = this.removeScriptAndStyleElements(html);
        const rawText = this.removeHtmlTagsAndEntities(cleanedHtml);
        return this.normalizeWhitespaces(rawText);
    },
    removeScriptAndStyleElements(html) {
        const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        return text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    },
    removeHtmlTagsAndEntities(text) {
        let parsedText = text.replace(/<[^>]*>/g, " ");
        parsedText = parsedText.replace(/&nbsp;/g, " ");
        parsedText = parsedText.replace(/&amp;/g, "&");
        parsedText = parsedText.replace(/&lt;/g, "<");
        parsedText = parsedText.replace(/&gt;/g, ">");
        return parsedText;
    },
    normalizeWhitespaces(text) {
        return text.replace(/\s+/g, " ").trim();
    },
    cleanWord(word) {
        // Remove punctuation from start and end of word
        return word.replace(/^[.,!?;:()[\]{}\-—–""'']+|[.,!?;:()[\]{}\-—–""'']+$/g, "");
    },
    extractWords(text) {
        // Split on whitespace and filter out empty strings
        return text.split(/\s+/).filter(Boolean);
    },
    isWordToSkip(word) {
        // Skip if contains numbers
        if (/[0-9]/.test(word)) {
            return true;
        }
        // Skip if it's purely symbols/punctuation
        if (!/[a-zA-ZÀ-ž]/.test(word)) {
            return true;
        }
        // Skip very short cleaned words
        const cleanedWord = this.cleanWord(word);
        if (cleanedWord.length <= 1) {
            return true;
        }
        return false;
    }
});
const createDictionaryManager = (fileOps = createFileOperations(defaultConfig.FILE_ENCODING), pathModule = path, config = defaultConfig, logger = console) => {
    const dictionaryCache = {};
    return {
        getAvailableDictionaries() {
            return __awaiter(this, void 0, void 0, function* () {
                const dictionariesDir = config.DICTIONARIES_DIR
                    ? pathModule.join(process.cwd(), config.DICTIONARIES_DIR)
                    : process.cwd();
                try {
                    if (!fileOps.exists(dictionariesDir)) {
                        fileOps.createDir(dictionariesDir);
                    }
                    const files = yield fileOps.readDir(dictionariesDir);
                    return files
                        .filter((file) => file.endsWith(".dic"))
                        .reduce((acc, file) => {
                        const lang = file.split(".")[0];
                        const affFile = `${lang}.aff`;
                        if (files.includes(affFile)) {
                            acc[lang] = {
                                dic: pathModule.join(dictionariesDir, file),
                                aff: pathModule.join(dictionariesDir, affFile)
                            };
                        }
                        return acc;
                    }, {});
                }
                catch (error) {
                    logger.error(`Error loading dictionaries: ${error.message}`);
                    return {};
                }
            });
        },
        getDictionary(language_1) {
            return __awaiter(this, arguments, void 0, function* (language, nspellModule = nspell) {
                if (dictionaryCache[language]) {
                    return dictionaryCache[language];
                }
                const dictionaries = yield this.getAvailableDictionaries();
                if (dictionaries[language]) {
                    try {
                        const dicData = fileOps.readFile(dictionaries[language].dic);
                        const affData = fileOps.readFile(dictionaries[language].aff);
                        const spell = nspellModule(affData, dicData);
                        yield this.addWhitelistedTerms(spell, language);
                        dictionaryCache[language] = spell;
                        return spell;
                    }
                    catch (error) {
                        logger.error(`Error loading dictionary for ${language}: ${error.message}`);
                    }
                }
                logger.log(`No dictionaries found, creating empty dictionary for '${language}' resume`);
                const dummySpell = {
                    correct: () => true, // All words are correct
                    suggest: () => [], // No suggestions
                    add: () => { } // No-op for adding words
                };
                dictionaryCache[language] = dummySpell;
                return dummySpell;
            });
        },
        addWhitelistedTerms(spell, language) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const whitelistDirPath = pathModule.join(process.cwd(), config.DICTIONARIES_DIR, config.WHITELIST_DIR);
                    if (!fileOps.exists(whitelistDirPath)) {
                        logger.log(`Whitelist directory not found: ${whitelistDirPath}`);
                        return;
                    }
                    const whitelistFiles = yield fileOps.readDir(whitelistDirPath); // Add await here
                    whitelistFiles
                        .filter((file) => file.endsWith(".txt"))
                        .forEach((file) => {
                        const filePath = pathModule.join(whitelistDirPath, file);
                        // Check if this is a language-specific whitelist
                        // Format: whitelist-en.txt, whitelist-es.txt, etc.
                        const langSpecific = file.match(/^.*-([a-z]{2})\.txt$/);
                        // If it's a language-specific file, only use it for the right language
                        if (langSpecific && langSpecific[1] !== language) {
                            return;
                        }
                        const content = fileOps.readFile(filePath);
                        const terms = content
                            .split("\n")
                            .map((term) => term.trim().toLowerCase())
                            .filter((term) => term && !term.startsWith("#"));
                        terms.forEach((term) => spell.add(term));
                    });
                }
                catch (error) {
                    logger.error(`Error loading whitelist: ${error.message}`);
                }
            });
        },
        clearCache() {
            Object.keys(dictionaryCache).forEach((key) => delete dictionaryCache[key]);
        }
    };
};
const createSpellChecker = (dictionaryManager = createDictionaryManager(), textProcessor = createTextProcessor(), config = defaultConfig, logger = console) => ({
    spellCheckHtml(html, language) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const spell = yield dictionaryManager.getDictionary(language);
                const text = textProcessor.extractTextFromHtml(html);
                const words = textProcessor.extractWords(text);
                const misspelled = [];
                words.forEach((rawWord) => {
                    const cleanedWord = textProcessor.cleanWord(rawWord);
                    if (textProcessor.isWordToSkip(cleanedWord)) {
                        return;
                    }
                    if (!spell.correct(cleanedWord)) {
                        misspelled.push({
                            word: rawWord,
                            cleanedWord, // Include the cleaned version for reference
                            suggestions: spell.suggest(cleanedWord).slice(0, config.MAX_SUGGESTIONS)
                        });
                    }
                });
                return {
                    language,
                    misspelledCount: misspelled.length,
                    misspelled,
                    text
                };
            }
            catch (error) {
                logger.error(`Spell check error: ${error.message}`);
                return {
                    language,
                    error: error.message,
                    misspelledCount: 0,
                    misspelled: []
                };
            }
        });
    }
});
const createSpellCheckerModule = (options = {}) => {
    const config = Object.assign(Object.assign({}, defaultConfig), options.config);
    const fileOps = options.fileOps || createFileOperations(config.FILE_ENCODING);
    const textProcessor = options.textProcessor || createTextProcessor();
    const dictionaryManager = options.dictionaryManager || createDictionaryManager(fileOps);
    const logger = options.logger || console;
    const spellChecker = createSpellChecker(dictionaryManager, textProcessor, config, logger);
    return {
        spellCheckHtml: spellChecker.spellCheckHtml,
        // Expose internals for testing
        textProcessor,
        dictionaryManager,
        clearCache: dictionaryManager.clearCache
    };
};
export default createSpellCheckerModule();
export const defaultModule = createSpellCheckerModule();
export const { spellCheckHtml, textProcessor, dictionaryManager, clearCache } = defaultModule;
export { createSpellCheckerModule, createTextProcessor, createDictionaryManager, createSpellChecker };
