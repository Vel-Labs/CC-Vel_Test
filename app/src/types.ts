export type SkillParseMode = "strict" | "lenient";

export type DiagnosticLevel = "info" | "warn" | "error";

export interface Diagnostic {
  level: DiagnosticLevel;
  message: string;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string;
  raw: Record<string, string | Record<string, string> | undefined>;
}

export interface SkillResourceIndex {
  scripts: string[];
  references: string[];
  assets: string[];
  evals: string[];
}

export interface Skill {
  name: string;
  description: string;
  rootDir: string;
  skillMdPath: string;
  frontmatter: SkillFrontmatter;
  body: string;
  rawContent: string;
  parseMode: SkillParseMode;
  diagnostics: Diagnostic[];
  resources: SkillResourceIndex;
}

export interface SkillCatalogItem {
  name: string;
  description: string;
  rootDir: string;
  diagnostics: Diagnostic[];
}

export interface SkillSelection {
  skillName: string | null;
  reason: string;
  source: "explicit" | "model" | "mock" | "none";
  usage?: ApiTokenUsage;
}

export interface ApiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface ModelResponse {
  text: string;
  usage?: ApiTokenUsage;
}

export interface TokenAudit {
  source: "estimate" | "anthropic";
  estimated: {
    prompt: number;
    localFileContext: number;
    catalog: number;
    activatedSkillBody: number;
    selectionInput: number;
    responseInput: number;
  };
  actual?: {
    selection?: ApiTokenUsage;
    response?: ApiTokenUsage;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

export interface AgentRunOptions {
  repoRoot: string;
  prompt: string;
  trace?: boolean;
  model?: string;
  mock?: boolean;
  ledger?: boolean;
}

export interface AgentRunResult {
  output: string;
  selectedSkill: string | null;
  traceText: string;
  tokenAudit: TokenAudit;
}
