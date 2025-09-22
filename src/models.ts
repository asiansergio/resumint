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

// Spell checker related types
export interface SpellCheckerConfig {
  DICTIONARIES_DIR: string;
  WHITELIST_DIR: string;
  MAX_SUGGESTIONS: number;
  FILE_ENCODING?: BufferEncoding;
}

export interface DictionaryFiles {
  dic: string;
  aff: string;
}

export interface AvailableDictionaries {
  [language: string]: DictionaryFiles;
}

export interface MisspelledWord {
  word: string;
  cleanedWord: string;
  suggestions: string[];
}

export interface SpellCheckResult {
  language: string;
  misspelledCount: number;
  misspelled: MisspelledWord[];
  text?: string;
  error?: string;
}

// nspell instance interface (since the library doesn't have types)
export interface SpellInstance {
  correct(word: string): boolean;
  suggest(word: string): string[];
  add(word: string): void;
}

export interface TextProcessor {
  extractTextFromHtml(html: string): string;
  removeScriptAndStyleElements(html: string): string;
  removeHtmlTagsAndEntities(text: string): string;
  normalizeWhitespaces(text: string): string;
  cleanWord(word: string): string;
  extractWords(text: string): string[];
  isWordToSkip(word: string): boolean;
}

export interface DictionaryManager {
  getAvailableDictionaries(): Promise<AvailableDictionaries>;
  getDictionary(language: string, nspellModule?: any): Promise<SpellInstance>;
  addWhitelistedTerms(spell: SpellInstance, language: string): Promise<void>;
  clearCache(): void;
}

export interface SpellChecker {
  spellCheckHtml(html: string, language: string): Promise<SpellCheckResult>;
}

export interface SpellCheckerModuleOptions {
  config?: Partial<SpellCheckerConfig>;
  fileOps?: any;
  textProcessor?: TextProcessor;
  dictionaryManager?: DictionaryManager;
  logger?: typeof console;
}

// Generator related types
export interface GeneratorConfig {
  A4_HEIGHT_PX: number;
  DATE_FORMAT: string;
}

export interface ResumeBasicInfo {
  name: string;
  [key: string]: any;
}

export interface ResumeMetadata {
  template?: string;
  [key: string]: any;
}

export interface ResumeData {
  basic: ResumeBasicInfo;
  metadata?: ResumeMetadata;
  languages: string[];
  [key: string]: any;
}

export interface CommandLineArgs {
  data: string;
  template?: string | undefined;
  templatesDir: string;
  output: string;
  language?: string | undefined;
  html?: boolean;
  htmlOnly?: boolean;
  noSpellCheck?: boolean;
  // Allow additional properties from yargs
  [key: string]: any;
}

export interface GenerationContext {
  resumeData: ResumeData;
  templatePath: string;
  outputDir: string;
  argv: CommandLineArgs;
}

// Removed unused generator interfaces - now using classes directly
