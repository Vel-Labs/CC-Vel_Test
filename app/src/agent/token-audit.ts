import type { ApiTokenUsage, Skill, SkillCatalogItem, TokenAudit } from "../types.js";
import { buildResponseSystemPrompt, buildSelectionSystemPrompt } from "./system-prompt.js";

export function estimateTokens(input: string): number {
  if (!input) return 0;
  return Math.max(1, Math.ceil(input.length / 4));
}

export function estimateCatalogTokens(catalog: SkillCatalogItem[]): number {
  return estimateTokens(catalog.map((skill) => `${skill.name}\n${skill.description}`).join("\n\n"));
}

export function buildTokenAudit(input: {
  prompt: string;
  localFileContextText: string;
  catalog: SkillCatalogItem[];
  activatedSkills: Skill[];
  selectionUsage?: ApiTokenUsage;
  responseUsage?: ApiTokenUsage;
}): TokenAudit {
  const modelPrompt = input.localFileContextText ? `${input.prompt}\n\n${input.localFileContextText}` : input.prompt;
  const activatedSkillBody = input.activatedSkills.map((skill) => skill.body).join("\n\n");
  const selectionInput = [
    buildSelectionSystemPrompt(input.catalog),
    input.prompt
  ].join("\n\n");
  const responseInput = [
    buildResponseSystemPrompt(input.catalog, input.activatedSkills),
    modelPrompt
  ].join("\n\n");

  const actual = input.selectionUsage || input.responseUsage
    ? {
        selection: input.selectionUsage,
        response: input.responseUsage,
        totalInputTokens: tokenSum(input.selectionUsage?.inputTokens, input.responseUsage?.inputTokens),
        totalOutputTokens: tokenSum(input.selectionUsage?.outputTokens, input.responseUsage?.outputTokens)
      }
    : undefined;

  return {
    source: actual ? "anthropic" : "estimate",
    estimated: {
      prompt: estimateTokens(input.prompt),
      localFileContext: estimateTokens(input.localFileContextText),
      catalog: estimateCatalogTokens(input.catalog),
      activatedSkillBody: estimateTokens(activatedSkillBody),
      selectionInput: estimateTokens(selectionInput),
      responseInput: estimateTokens(responseInput)
    },
    actual
  };
}

export function formatTokenAuditTrace(audit: TokenAudit): string[] {
  const lines = [
    `token source: ${audit.source === "anthropic" ? "anthropic usage plus local estimates" : "local estimate only"}`,
    `token estimate prompt: ${audit.estimated.prompt}`,
    `token estimate local file context: ${audit.estimated.localFileContext}`,
    `token estimate catalog metadata: ${audit.estimated.catalog}`,
    `token estimate activated skill body: ${audit.estimated.activatedSkillBody}`,
    `token estimate selection input: ${audit.estimated.selectionInput}`,
    `token estimate response input: ${audit.estimated.responseInput}`
  ];

  if (audit.actual?.selection) {
    lines.push(`api selection tokens: input ${audit.actual.selection.inputTokens}, output ${audit.actual.selection.outputTokens}`);
  }
  if (audit.actual?.response) {
    lines.push(`api response tokens: input ${audit.actual.response.inputTokens}, output ${audit.actual.response.outputTokens}`);
  }
  if (audit.actual) {
    lines.push(`api total tokens: input ${audit.actual.totalInputTokens}, output ${audit.actual.totalOutputTokens}`);
  }
  return lines;
}

export function formatTokenEstimate(tokens: number): string {
  if (tokens >= 1000) return `~${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k tokens`;
  return `~${tokens} tokens`;
}

function tokenSum(...values: Array<number | undefined>): number {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
