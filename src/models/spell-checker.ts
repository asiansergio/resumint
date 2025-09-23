export interface FileOperations {
  readJSON(path: string): any;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  exists(path: string): boolean;
  createDir(path: string): void;
  deleteFile(path: string): void;
  readDir(path: string): Promise<string[]>;
}

export interface AvailableDictionaries {
  [language: string]: { dic: string; aff: string };
}

export interface SpellCheckerConfig {
  DICTIONARIES_DIR: string;
  WHITELIST_DIR: string;
  MAX_SUGGESTIONS: number;
  FILE_ENCODING?: BufferEncoding;
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

export interface SpellInstance {
  correct(_word: string): boolean;
  suggest(_word: string): string[];
  add(_word: string): void;
}

export interface TextProcessor {
  extractTextFromHtml(_html: string): string;
  removeScriptAndStyleElements(_html: string): string;
  removeHtmlTagsAndEntities(_text: string): string;
  normalizeWhitespaces(_text: string): string;
  cleanWord(_word: string): string;
  extractWords(_text: string): string[];
  isWordToSkip(_word: string): boolean;
}

export interface DictionaryManager {
  getAvailableDictionaries(): Promise<{ [language: string]: { dic: string; aff: string } }>;
  getDictionary(_language: string, _nspellModule?: any): Promise<SpellInstance>;
  addWhitelistedTerms(_spell: SpellInstance, _language: string): Promise<void>;
  clearCache(): void;
}

export interface SpellChecker {
  spellCheckHtml(_html: string, _language: string): Promise<SpellCheckResult>;
}

export interface SpellCheckerModuleOptions {
  config?: Partial<SpellCheckerConfig>;
  fileOps?: any;
  textProcessor?: TextProcessor;
  dictionaryManager?: DictionaryManager;
  logger?: typeof console;
}
