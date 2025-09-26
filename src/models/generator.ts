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

export interface GenerationResult {
  logs: string[];
}
