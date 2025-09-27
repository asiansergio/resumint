export interface ResumeData {
  basic: { name: string; [key: string]: any };
  metadata?: { template?: string; [key: string]: any };
  languages: string[];
  [key: string]: any;
}

export interface CommandLineArgs {
  data: string;
  template?: string;
  templatesDir: string;
  output: string;
  language?: string;
  html?: boolean;
  htmlOnly?: boolean;
  noSpellCheck?: boolean;
  [key: string]: any;
}

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export interface GenerationResult {
  language: string;
  templateName: string;
  outputDir: string;
  baseFileName: string;
  html: string;
  logs: LogEntry[];
  errors: string[];
  success: boolean;
  metadata: {
    generationTime?: Date;
    htmlFileSize?: number;
    pdfFileSize?: number;
    spellCheckEnabled: boolean;
  };
}
