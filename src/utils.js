import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { readdir } from "fs/promises";

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const createLogger = (console = global.console) => ({
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
});

export const withErrorHandling =
  (fn, logger, process = global.process) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

export const createFileOperations = (
  fileEncoding = "utf8",
  fs = { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdir }
) => ({
  readJSON(path) {
    return JSON.parse(fs.readFileSync(path, fileEncoding));
  },

  readFile(path) {
    return fs.readFileSync(path, fileEncoding);
  },

  writeFile(path, content) {
    fs.writeFileSync(path, content);
  },

  exists(path) {
    return fs.existsSync(path);
  },

  createDir(path) {
    fs.mkdirSync(path, { recursive: true });
  },

  deleteFile(path) {
    fs.unlinkSync(path);
  },

  async readDir(path) {
    return fs.readdir(path);
  }
});
