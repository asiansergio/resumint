// Essential types for spell checker module only

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
  getAvailableDictionaries(): Promise<{ [language: string]: { dic: string; aff: string } }>;
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

