import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { ResumeGenerator } from "../../src/generator.js";

// Mock the dependencies
jest.mock("../../src/utils.js");
jest.mock("../../src/spell-checker.js");
jest.mock("handlebars");
jest.mock("puppeteer");

describe("ResumeGenerator", () => {
  let generator;
  let mockUtils;
  let mockSpellChecker;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock utils
    mockUtils = {
      createFileOperations: jest.fn(() => ({
        readJSON: jest.fn(),
        writeFile: jest.fn(),
        exists: jest.fn(),
        createDir: jest.fn(),
        deleteFile: jest.fn()
      })),
      createLogger: jest.fn(() => ({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      })),
      getCurrentDate: jest.fn(() => "20240101")
    };

    // Mock spell checker
    mockSpellChecker = {
      spellCheckHtml: jest.fn(() => Promise.resolve({
        misspelledCount: 0,
        misspelled: []
      }))
    };

    // Apply mocks
    require("../../src/utils.js").createFileOperations = mockUtils.createFileOperations;
    require("../../src/utils.js").createLogger = mockUtils.createLogger;
    require("../../src/utils.js").getCurrentDate = mockUtils.getCurrentDate;
    require("../../src/spell-checker.js").default = mockSpellChecker;

    generator = new ResumeGenerator();
  });

  test("should be instantiable", () => {
    expect(generator).toBeInstanceOf(ResumeGenerator);
  });

  test("should have generateResumes method", () => {
    expect(typeof generator.generateResumes).toBe("function");
  });
});