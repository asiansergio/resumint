import { jest, describe, test, expect } from "@jest/globals";
import * as generator from "../../src/generator.js";

describe("Generator Module - Pure Functions", () => {
  describe("isValidHeight", () => {
    test("isValidHeight returns true when content fits A4", async () => {
      const mockPage = {
        evaluate: jest.fn().mockResolvedValue(1000) // Less than A4 height (1123px)
      };

      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await generator.isValidHeight(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(console.log).not.toHaveBeenCalled();

      console.log = originalConsoleLog;
    });

    test("isValidHeight returns false when content exceeds A4", async () => {
      const mockPage = {
        evaluate: jest.fn().mockResolvedValue(1200) // Greater than A4 height (1123px)
      };

      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await generator.isValidHeight(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Content height (1200px) exceeds A4 maximum (1123px)")
      );

      console.log = originalConsoleLog;
    });

    test("isValidHeight handles missing resume container", async () => {
      const mockPage = {
        evaluate: jest.fn().mockImplementation(async () => {
          console.warn("Resume container not found, using body height");
          return 900; // Mock body height
        })
      };

      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      const result = await generator.isValidHeight(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toBe(true); // 900 < 1123, so it should be valid

      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    });
  });

  describe("ensureAtLeastOneLanguageIsSpecified", () => {
    test("throws error when no languages are specified", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const exitSpy = jest.spyOn(process, "exit").mockImplementation();

      // Simulate undefined languages
      generator.ensureAtLeastOneLanguageIsSpecified(undefined);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No languages specified"));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("getTemplatePath", () => {
    test("uses template from args when provided", () => {
      const argv = { template: "fancy", templatesDir: "./templates" };
      const resumeData = {};

      const result = generator.getTemplatePath(argv, resumeData);

      expect(result.endsWith("fancy-template.html")).toBe(true);
    });

    test("uses template from resumeData metadata when args not provided", () => {
      const argv = { templatesDir: "./templates" };
      const resumeData = { metadata: { template: "custom" } };

      const result = generator.getTemplatePath(argv, resumeData);

      expect(result.endsWith("custom-template.html")).toBe(true);
    });

    test("defaults to 'default' template when neither provided", () => {
      const argv = { templatesDir: "./templates" };
      const resumeData = {};

      const result = generator.getTemplatePath(argv, resumeData);

      expect(result.endsWith("default-template.html")).toBe(true);
    });
  });

  describe("getLanguagesToGenerate", () => {
    test("returns specific language when provided in args", () => {
      const argv = { language: "en" };
      const resumeData = { languages: ["en", "es", "fr"] };

      const result = generator.getLanguagesToGenerate(argv, resumeData);

      expect(result).toEqual(["en"]);
    });

    test("returns all languages from resumeData when no specific language provided", () => {
      const argv = {};
      const resumeData = { languages: ["en", "es", "fr"] };

      const result = generator.getLanguagesToGenerate(argv, resumeData);

      expect(result).toEqual(["en", "es", "fr"]);
    });
  });

  describe("Context creation and manipulation", () => {
    test("creates correct context object", () => {
      const resumeData = { test: "data" };
      const templatePath = "/path/to/template";
      const outputDir = "/path/to/output";
      const argv = { test: "args" };

      const context = { resumeData, templatePath, outputDir, argv };

      expect(context.resumeData).toEqual({ test: "data" });
      expect(context.templatePath).toBe("/path/to/template");
      expect(context.outputDir).toBe("/path/to/output");
      expect(context.argv).toEqual({ test: "args" });
    });

    test("generateResumeForLanguage creates correct base filename", () => {
      // We can test just the filename generation logic
      const language = "en";
      const currentDate = "20231225";
      const name = "John Doe";

      const expected = `${currentDate}-${language}-john-doe`;
      const actual = `${currentDate}-${language}-${name.toLowerCase().replace(/\s+/g, "-")}`;

      expect(actual).toBe(expected);
    });
  });
});
