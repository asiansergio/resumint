import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { createGenerator } from "../../src/generator.js";

describe("Generator Module - Refactored Tests", () => {
  let generator;
  let mockDependencies;

  beforeEach(() => {
    // Create mock dependencies
    mockDependencies = {
      fileOps: {
        readJSON: jest.fn(),
        writeFile: jest.fn(),
        exists: jest.fn(),
        createDir: jest.fn(),
        deleteFile: jest.fn()
      },
      htmlGenerator: {
        generate: jest.fn()
      },
      pdfGenerator: {
        generate: jest.fn(),
        isValidHeight: jest.fn()
      },
      logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      },
      path: {
        resolve: jest.fn(),
        join: jest.fn()
      },
      process: {
        exit: jest.fn(),
        cwd: jest.fn()
      },
      utils: {
        getCurrentDate: jest.fn()
      }
    };

    // Create generator instance with mock dependencies
    generator = createGenerator(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResumes", () => {
    test("successfully generates resumes", async () => {
      const mockArgv = {
        data: "resume.json",
        template: "custom",
        templatesDir: "./templates",
        output: "./output",
        language: "en",
        html: true,
        htmlOnly: false
      };

      // Setup mocks
      mockDependencies.fileOps.readJSON.mockReturnValue({
        basic: { name: "Test User" },
        languages: ["en"],
        metadata: {}
      });
      mockDependencies.process.cwd.mockReturnValue("/current/dir");
      mockDependencies.path.resolve.mockImplementation((...args) => args.join("/"));
      mockDependencies.path.join.mockImplementation((...args) => args.join("/"));
      mockDependencies.fileOps.exists.mockReturnValue(true);
      mockDependencies.htmlGenerator.generate.mockReturnValue("<html></html>");
      mockDependencies.utils.getCurrentDate.mockReturnValue("20231225");

      await generator.generateResumes(mockArgv);

      // Verify the flow
      expect(mockDependencies.fileOps.readJSON).toHaveBeenCalledWith("resume.json");
      expect(mockDependencies.path.resolve).toHaveBeenCalledWith(
        "/current/dir",
        "./templates",
        "custom-template.html"
      );
      expect(mockDependencies.fileOps.exists).toHaveBeenCalled();
      expect(mockDependencies.htmlGenerator.generate).toHaveBeenCalled();
      expect(mockDependencies.pdfGenerator.generate).toHaveBeenCalled();
      expect(mockDependencies.logger.log).toHaveBeenCalledWith(
        expect.stringContaining("Resume generation completed successfully!")
      );
    });

    test("handles errors gracefully", async () => {
      const mockArgv = { data: "non-existent.json" };

      mockDependencies.fileOps.readJSON.mockImplementation(() => {
        throw new Error("File not found");
      });

      await generator.generateResumes(mockArgv);

      expect(mockDependencies.logger.error).toHaveBeenCalledWith("Error: File not found");
      expect(mockDependencies.process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("pure functions", () => {
    test("getResumeData reads and parses JSON", () => {
      const mockData = { basic: { name: "Test" } };
      mockDependencies.fileOps.readJSON.mockReturnValue(mockData);

      const result = generator.getResumeData("test.json");

      expect(mockDependencies.fileOps.readJSON).toHaveBeenCalledWith("test.json");
      expect(result).toEqual(mockData);
    });

    test("getTemplatePath uses correct template", () => {
      const argv = { template: "fancy", templatesDir: "./templates" };
      const resumeData = {};

      mockDependencies.process.cwd.mockReturnValue("/current/dir");
      mockDependencies.path.resolve.mockReturnValue("/full/path/fancy-template.html");

      const result = generator.getTemplatePath(argv, resumeData);

      expect(mockDependencies.path.resolve).toHaveBeenCalledWith(
        "/current/dir",
        "./templates",
        "fancy-template.html"
      );
      expect(result).toBe("/full/path/fancy-template.html");
    });

    test("ensureTemplateExists checks file existence", () => {
      mockDependencies.fileOps.exists.mockReturnValue(true);

      // Should not throw or exit
      generator.ensureTemplateExists("template.html");

      expect(mockDependencies.fileOps.exists).toHaveBeenCalledWith("template.html");
      expect(mockDependencies.process.exit).not.toHaveBeenCalled();
    });

    test("getOrCreateOutputDirectory handles new directory", () => {
      mockDependencies.process.cwd.mockReturnValue("/current/dir");
      mockDependencies.path.resolve.mockReturnValue("/full/path/output");
      mockDependencies.fileOps.exists.mockReturnValue(false);

      const result = generator.getOrCreateOutputDirectory("output");

      expect(mockDependencies.fileOps.createDir).toHaveBeenCalledWith("/full/path/output");
      expect(result).toBe("/full/path/output");
    });

    test("ensureAtLeastOneLanguageIsSpecified validates languages", () => {
      generator.ensureAtLeastOneLanguageIsSpecified([]);

      expect(mockDependencies.logger.error).toHaveBeenCalledWith(
        "No languages specified in resume data or via command line"
      );
      expect(mockDependencies.process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("generateResumeForLanguage", () => {
    test("generates HTML and PDF for language", async () => {
      const context = {
        resumeData: { basic: { name: "Test User" } },
        templatePath: "template.html",
        outputDir: "/output",
        argv: { html: true, htmlOnly: false }
      };

      mockDependencies.utils.getCurrentDate.mockReturnValue("20231225");
      mockDependencies.htmlGenerator.generate.mockReturnValue("<html></html>");
      mockDependencies.path.join.mockImplementation((...args) => args.join("/"));

      await generator.generateResumeForLanguage(context, "en");

      expect(mockDependencies.htmlGenerator.generate).toHaveBeenCalledWith(
        context.resumeData,
        "en",
        context.templatePath
      );
      expect(mockDependencies.fileOps.writeFile).toHaveBeenCalled();
      expect(mockDependencies.pdfGenerator.generate).toHaveBeenCalled();
    });

    test("skips PDF generation when htmlOnly is true", async () => {
      const context = {
        resumeData: { basic: { name: "Test" } },
        templatePath: "template.html",
        outputDir: "/output",
        argv: { htmlOnly: true }
      };

      mockDependencies.htmlGenerator.generate.mockReturnValue("<html></html>");
      mockDependencies.path.join.mockImplementation((...args) => args.join("/"));

      await generator.generateResumeForLanguage(context, "en");

      expect(mockDependencies.pdfGenerator.generate).not.toHaveBeenCalled();
    });
  });

  describe("HTML and PDF generators", () => {
    test("htmlGenerator generates HTML correctly", () => {
      const data = { basic: { name: "Test" } };
      const language = "en";
      const templatePath = "template.html";

      generator.htmlGenerator.generate(data, language, templatePath);

      expect(mockDependencies.htmlGenerator.generate).toHaveBeenCalledWith(
        data,
        language,
        templatePath
      );
    });

    test("pdfGenerator generates PDF correctly", async () => {
      const htmlPath = "input.html";
      const outputPath = "output.pdf";

      await generator.pdfGenerator.generate(htmlPath, outputPath);

      expect(mockDependencies.pdfGenerator.generate).toHaveBeenCalledWith(htmlPath, outputPath);
    });
  });
});
