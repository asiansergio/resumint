import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  createSpellCheckerModule,
  createTextProcessor,
  createDictionaryManager,
  createSpellChecker
} from "../../src/spell-checker.js";

describe("Spell Checker Module", () => {
  describe("createTextProcessor", () => {
    let textProcessor;

    beforeEach(() => {
      textProcessor = createTextProcessor();
    });

    test("extracts text from HTML correctly", () => {
      const html = "<div>Hello <span>world</span></div>";
      const result = textProcessor.extractTextFromHtml(html);
      expect(result).toBe("Hello world");
    });

    test("removes script and style elements", () => {
      const html = `
        <div>Content</div>
        <script>alert('test');</script>
        <style>body { color: red; }</style>
        <p>More content</p>
      `;
      const result = textProcessor.extractTextFromHtml(html);
      expect(result).toBe("Content More content");
    });

    test("identifies numeric words", () => {
      expect(textProcessor.isWordToSkip("abc123")).toBe(true);
      expect(textProcessor.isWordToSkip("123")).toBe(true);
      expect(textProcessor.isWordToSkip("hello")).toBe(false);
    });
  });

  describe("createDictionaryManager", () => {
    let mockFileOps;
    let mockPath;
    let mockLogger;
    let dictionaryManager;

    beforeEach(() => {
      mockFileOps = {
        readFile: jest.fn(),
        exists: jest.fn(),
        createDir: jest.fn(),
        readDir: jest.fn()
      };
      mockPath = {
        join: jest.fn((...paths) => paths.join("/"))
      };
      mockLogger = {
        log: jest.fn(),
        error: jest.fn()
      };
      dictionaryManager = createDictionaryManager(mockFileOps, mockPath, {}, mockLogger);
    });

    test("finds available dictionaries using readDir", async () => {
      mockFileOps.exists.mockReturnValue(true);
      mockFileOps.readDir.mockResolvedValue(["en.dic", "en.aff", "es.dic", "fr.dic"]);

      const result = await dictionaryManager.getAvailableDictionaries();

      expect(mockFileOps.readDir).toHaveBeenCalled();

      expect(result).toMatchObject({
        en: {
          dic: expect.stringContaining("/en.dic"),
          aff: expect.stringContaining("/en.aff")
        }
      });
    });

    test("creates directory if not exists", async () => {
      mockFileOps.exists.mockReturnValue(false);
      mockFileOps.readDir.mockResolvedValue([]);

      await dictionaryManager.getAvailableDictionaries();

      expect(mockFileOps.createDir).toHaveBeenCalled();
    });

    test("handles errors gracefully", async () => {
      mockFileOps.exists.mockReturnValue(true);
      mockFileOps.readDir.mockRejectedValue(new Error("Read error"));

      const result = await dictionaryManager.getAvailableDictionaries();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error loading dictionaries")
      );
      expect(result).toEqual({});
    });

    test("loads dictionary from files", async () => {
      const mockSpell = {
        correct: jest.fn().mockReturnValue(true),
        suggest: jest.fn().mockReturnValue([]),
        add: jest.fn()
      };
      const mockNspell = jest.fn().mockReturnValue(mockSpell);

      mockFileOps.exists.mockReturnValue(true);
      mockFileOps.readDir.mockResolvedValue(["en.dic", "en.aff"]);
      mockFileOps.readFile.mockReturnValue("mock content");

      const spell = await dictionaryManager.getDictionary("en", mockNspell);

      expect(mockFileOps.readFile).toHaveBeenCalledTimes(3);
      expect(mockNspell).toHaveBeenCalled();
      expect(spell).toBe(mockSpell);
    });
  });

  describe("createSpellChecker", () => {
    let mockDictionaryManager;
    let mockTextProcessor;
    let mockLogger;
    let spellChecker;

    beforeEach(() => {
      mockDictionaryManager = {
        getDictionary: jest.fn()
      };
      mockTextProcessor = {
        extractTextFromHtml: jest.fn(),
        extractWords: jest.fn(),
        cleanWord: jest.fn(),
        isWordToSkip: jest.fn()
      };
      mockLogger = {
        error: jest.fn(),
        log: jest.fn(),
        warn: jest.fn()
      };
      spellChecker = createSpellChecker(mockDictionaryManager, mockTextProcessor, {}, mockLogger);
    });

    test("identifies misspelled words", async () => {
      const mockSpell = {
        correct: jest.fn().mockImplementation((word) => word !== "worng"),
        suggest: jest.fn().mockReturnValue(["wrong", "word", "working"]),
        add: jest.fn()
      };

      mockDictionaryManager.getDictionary.mockResolvedValue(mockSpell);
      mockDictionaryManager.addWhitelistedTerms = jest.fn().mockResolvedValue(undefined);
      mockTextProcessor.extractTextFromHtml.mockReturnValue("This is worng text");
      mockTextProcessor.extractWords.mockReturnValue(["This", "is", "worng", "text"]);
      mockTextProcessor.cleanWord = jest.fn().mockImplementation((word) => word);
      mockTextProcessor.isWordToSkip.mockReturnValue(false);

      const result = await spellChecker.spellCheckHtml("<html>test</html>", "en");

      expect(result.language).toBe("en");
      expect(result.misspelledCount).toBe(1);
      expect(result.misspelled[0].word).toBe("worng");
      expect(result.misspelled[0].suggestions).toEqual(["wrong", "word", "working"]);
    });
  });

  describe("createSpellCheckerModule", () => {
    test("returns complete spell checker interface", () => {
      const module = createSpellCheckerModule();

      expect(module).toHaveProperty("spellCheckHtml");
      expect(module).toHaveProperty("textProcessor");
      expect(module).toHaveProperty("dictionaryManager");
      expect(module).toHaveProperty("clearCache");
      expect(typeof module.spellCheckHtml).toBe("function");
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
