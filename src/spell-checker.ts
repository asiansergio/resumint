// @ts-ignore - nspell doesn't have types
import nspell from "nspell";
import path from "path";
import { getErrorMessage, createFileOperations } from "./utils.js";
import type {
  SpellCheckerConfig,
  AvailableDictionaries,
  MisspelledWord,
  SpellCheckResult,
  SpellInstance,
  TextProcessor,
  DictionaryManager,
  SpellChecker,
  SpellCheckerModuleOptions
} from "./models.js";

const defaultConfig: SpellCheckerConfig = {
  DICTIONARIES_DIR: "dictionaries",
  WHITELIST_DIR: "whitelist",
  MAX_SUGGESTIONS: 5,
  FILE_ENCODING: "utf8" as BufferEncoding
};

const createTextProcessor = (): TextProcessor => ({
  extractTextFromHtml(html: string) {
    const cleanedHtml = this.removeScriptAndStyleElements(html);
    const rawText = this.removeHtmlTagsAndEntities(cleanedHtml);
    return this.normalizeWhitespaces(rawText);
  },

  removeScriptAndStyleElements(html: string) {
    const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    return text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  },

  removeHtmlTagsAndEntities(text: string) {
    let parsedText = text.replace(/<[^>]*>/g, " ");
    parsedText = parsedText.replace(/&nbsp;/g, " ");
    parsedText = parsedText.replace(/&amp;/g, "&");
    parsedText = parsedText.replace(/&lt;/g, "<");
    parsedText = parsedText.replace(/&gt;/g, ">");
    return parsedText;
  },

  normalizeWhitespaces(text: string) {
    return text.replace(/\s+/g, " ").trim();
  },

  cleanWord(word: string) {
    // Remove punctuation from start and end of word
    return word.replace(/^[.,!?;:()[\]{}\-—–""'']+|[.,!?;:()[\]{}\-—–""'']+$/g, "");
  },

  extractWords(text: string) {
    // Split on whitespace and filter out empty strings
    return text.split(/\s+/).filter(Boolean);
  },

  isWordToSkip(word: string) {
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

const createDictionaryManager = (
  fileOps = createFileOperations(defaultConfig.FILE_ENCODING || ("utf8" as BufferEncoding)),
  pathModule = path,
  config: SpellCheckerConfig = defaultConfig,
  logger = console
): DictionaryManager => {
  const dictionaryCache: { [language: string]: SpellInstance } = {};

  return {
    async getAvailableDictionaries(): Promise<AvailableDictionaries> {
      const dictionariesDir = config.DICTIONARIES_DIR
        ? pathModule.join(process.cwd(), config.DICTIONARIES_DIR)
        : process.cwd();

      try {
        if (!fileOps.exists(dictionariesDir)) {
          fileOps.createDir(dictionariesDir);
        }

        const files = await fileOps.readDir(dictionariesDir);

        return files
          .filter((file) => file.endsWith(".dic"))
          .reduce((acc: AvailableDictionaries, file) => {
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
      } catch (error) {
        logger.error(`Error loading dictionaries: ${getErrorMessage(error)}`);
        return {};
      }
    },

    async getDictionary(language: string, nspellModule = nspell): Promise<SpellInstance> {
      if (dictionaryCache[language]) {
        return dictionaryCache[language];
      }

      const dictionaries = await this.getAvailableDictionaries();

      if (dictionaries[language]) {
        try {
          const dicData = fileOps.readFile(dictionaries[language].dic);
          const affData = fileOps.readFile(dictionaries[language].aff);

          const spell = nspellModule(affData, dicData);

          await this.addWhitelistedTerms(spell, language);

          dictionaryCache[language] = spell;
          return spell;
        } catch (error) {
          logger.error(`Error loading dictionary for ${language}: ${getErrorMessage(error)}`);
        }
      }

      logger.log(`No dictionaries found, creating empty dictionary for '${language}' resume`);
      const dummySpell: SpellInstance = {
        correct: () => true, // All words are correct
        suggest: () => [], // No suggestions
        add: () => {} // No-op for adding words
      };
      dictionaryCache[language] = dummySpell;
      return dummySpell;
    },

    async addWhitelistedTerms(spell: SpellInstance, language: string): Promise<void> {
      try {
        const whitelistDirPath = pathModule.join(
          process.cwd(),
          config.DICTIONARIES_DIR,
          config.WHITELIST_DIR
        );

        if (!fileOps.exists(whitelistDirPath)) {
          logger.log(`Whitelist directory not found: ${whitelistDirPath}`);
          return;
        }

        const whitelistFiles = await fileOps.readDir(whitelistDirPath); // Add await here

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
      } catch (error) {
        logger.error(`Error loading whitelist: ${getErrorMessage(error)}`);
      }
    },

    clearCache() {
      Object.keys(dictionaryCache).forEach((key) => delete dictionaryCache[key]);
    }
  };
};

const createSpellChecker = (
  dictionaryManager: DictionaryManager = createDictionaryManager(),
  textProcessor: TextProcessor = createTextProcessor(),
  config: SpellCheckerConfig = defaultConfig,
  logger = console
): SpellChecker => ({
  async spellCheckHtml(html: string, language: string): Promise<SpellCheckResult> {
    try {
      const spell = await dictionaryManager.getDictionary(language);
      const text = textProcessor.extractTextFromHtml(html);
      const words = textProcessor.extractWords(text);
      const misspelled: MisspelledWord[] = [];

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
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Spell check error: ${errorMessage}`);
      return {
        language,
        error: errorMessage,
        misspelledCount: 0,
        misspelled: []
      };
    }
  }
});

const createSpellCheckerModule = (options: SpellCheckerModuleOptions = {}) => {
  const config = { ...defaultConfig, ...options.config };
  const fileOps =
    options.fileOps || createFileOperations(config.FILE_ENCODING || ("utf8" as BufferEncoding));
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

export {
  createSpellCheckerModule,
  createTextProcessor,
  createDictionaryManager,
  createSpellChecker
};

// Re-export types from models.ts for external use
export type {
  SpellCheckerConfig,
  DictionaryManager,
  TextProcessor,
  SpellCheckResult,
  MisspelledWord,
  SpellInstance,
  SpellCheckerModuleOptions
} from "./models.js";
