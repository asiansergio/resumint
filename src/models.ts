import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { readdir } from "fs/promises";

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface Console {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface Process {
  exit: (code?: number) => never;
}

export interface FileSystem {
  readFileSync: typeof readFileSync;
  writeFileSync: typeof writeFileSync;
  existsSync: typeof existsSync;
  mkdirSync: typeof mkdirSync;
  unlinkSync: typeof unlinkSync;
  readdir: typeof readdir;
}

export interface FileOperations {
  readJSON(path: string): any;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  createDir(path: string): void;
  deleteFile(path: string): void;
  readDir(path: string): Promise<string[]>;
}
