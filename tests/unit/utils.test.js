import { jest, describe, test, expect } from "@jest/globals";
import * as utils from "../../src/utils.js";

describe("Utils Module - Unit Tests", () => {
  describe("getCurrentDate", () => {
    test("returns date in YYYYMMDD format", () => {
      const mockDate = new Date(2023, 10, 15); // November 15, 2023
      jest.spyOn(global, "Date").mockImplementation(() => mockDate);

      const result = utils.getCurrentDate();
      expect(result).toBe("20231115");

      jest.restoreAllMocks();
    });

    test("handles single-digit months and days", () => {
      const mockDate = new Date(2023, 0, 5); // January 5, 2023
      jest.spyOn(global, "Date").mockImplementation(() => mockDate);

      const result = utils.getCurrentDate();
      expect(result).toBe("20230105");

      jest.restoreAllMocks();
    });
  });

  describe("createLogger", () => {
    test("returns object with log methods", () => {
      const logger = utils.createLogger();

      expect(logger).toHaveProperty("log");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("warn");
      expect(typeof logger.log).toBe("function");
    });

    test("uses provided console", () => {
      const mockConsole = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      };

      const logger = utils.createLogger(mockConsole);
      logger.log("test");

      expect(mockConsole.log).toHaveBeenCalledWith("test");
    });
  });

  describe("withErrorHandling", () => {
    test("returns wrapped function", () => {
      const fn = () => {};
      const logger = { error: jest.fn() };
      const process = { exit: jest.fn() };

      const wrapped = utils.withErrorHandling(fn, logger, process);

      expect(typeof wrapped).toBe("function");
    });

    test("passes through successful result", async () => {
      const fn = () => "success";
      const logger = { error: jest.fn() };
      const process = { exit: jest.fn() };

      const wrapped = utils.withErrorHandling(fn, logger, process);
      const result = await wrapped();

      expect(result).toBe("success");
      expect(logger.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    });

    test("handles errors and exits", async () => {
      const fn = () => {
        throw new Error("test error");
      };
      const logger = { error: jest.fn() };
      const process = { exit: jest.fn() };

      const wrapped = utils.withErrorHandling(fn, logger, process);
      await wrapped();

      expect(logger.error).toHaveBeenCalledWith("Error: test error");
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("createFileOperations", () => {
    test("returns object with file operation methods", () => {
      const mockFs = {
        readFileSync: jest.fn(),
        writeFileSync: jest.fn(),
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdir: jest.fn()
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);

      expect(fileOps).toHaveProperty("readJSON");
      expect(fileOps).toHaveProperty("readFile");
      expect(fileOps).toHaveProperty("writeFile");
      expect(fileOps).toHaveProperty("exists");
      expect(fileOps).toHaveProperty("createDir");
      expect(fileOps).toHaveProperty("deleteFile");
      expect(fileOps).toHaveProperty("readDir");
    });

    test("readDir calls fs readdir", async () => {
      const mockFs = {
        readdir: jest.fn().mockResolvedValue(["file1.txt", "file2.txt"])
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      const result = await fileOps.readDir("test-dir");

      expect(mockFs.readdir).toHaveBeenCalledWith("test-dir");
      expect(result).toEqual(["file1.txt", "file2.txt"]);
    });

    test("readJSON uses correct encoding", () => {
      const mockFs = {
        readFileSync: jest.fn().mockReturnValue("{\"key\": \"value\"}")
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      fileOps.readJSON("test.json");

      expect(mockFs.readFileSync).toHaveBeenCalledWith("test.json", "utf-8");
    });

    test("readFile uses correct encoding", () => {
      const mockFs = {
        readFileSync: jest.fn()
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      fileOps.readFile("test.txt");

      expect(mockFs.readFileSync).toHaveBeenCalledWith("test.txt", "utf-8");
    });

    test("writeFile calls fs writeFileSync", () => {
      const mockFs = {
        writeFileSync: jest.fn()
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      fileOps.writeFile("test.txt", "content");

      expect(mockFs.writeFileSync).toHaveBeenCalledWith("test.txt", "content");
    });

    test("exists calls fs existsSync", () => {
      const mockFs = {
        existsSync: jest.fn().mockReturnValue(true)
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      const result = fileOps.exists("file.txt");

      expect(mockFs.existsSync).toHaveBeenCalledWith("file.txt");
      expect(result).toBe(true);
    });

    test("createDir calls fs mkdirSync with recursive", () => {
      const mockFs = {
        mkdirSync: jest.fn()
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      fileOps.createDir("path");

      expect(mockFs.mkdirSync).toHaveBeenCalledWith("path", { recursive: true });
    });

    test("deleteFile calls fs unlinkSync", () => {
      const mockFs = {
        unlinkSync: jest.fn()
      };

      const fileOps = utils.createFileOperations("utf-8", mockFs);
      fileOps.deleteFile("file.txt");

      expect(mockFs.unlinkSync).toHaveBeenCalledWith("file.txt");
    });
  });
});
