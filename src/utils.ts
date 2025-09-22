import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { readdir } from "fs/promises";
import { Logger, Console, Process, FileSystem, FileOperations } from "./models.js";

export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

export const createLogger = (console: Console = global.console): Logger => ({
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args)
});

// Removed withErrorHandling - now handled directly in ResumeGenerator class

export function createFileOperations(
  fileEncoding: BufferEncoding = "utf8",
  fs: FileSystem = { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdir }
): FileOperations {
  return {
    readJSON(path: string): any {
      return JSON.parse(fs.readFileSync(path, fileEncoding));
    },
    readFile(path: string): string {
      return fs.readFileSync(path, fileEncoding);
    },
    writeFile(path: string, content: string): void {
      fs.writeFileSync(path, content);
    },
    exists(path: string): boolean {
      return fs.existsSync(path);
    },
    createDir(path: string): void {
      fs.mkdirSync(path, { recursive: true });
    },
    deleteFile(path: string): void {
      fs.unlinkSync(path);
    },
    async readDir(path: string): Promise<string[]> {
      return fs.readdir(path);
    }
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
