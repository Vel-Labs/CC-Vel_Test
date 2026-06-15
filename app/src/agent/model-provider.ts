import Anthropic from "@anthropic-ai/sdk";
import type { ApiTokenUsage, ModelResponse, Skill, SkillCatalogItem, SkillSelection } from "../types.js";
import { buildResponseSystemPrompt, buildSelectionSystemPrompt } from "./system-prompt.js";

export interface ModelProvider {
  selectSkill(prompt: string, catalog: SkillCatalogItem[]): Promise<SkillSelection>;
  respond(prompt: string, catalog: SkillCatalogItem[], activatedSkills: Skill[]): Promise<ModelResponse>;
}

export interface ProviderOptions {
  model?: string;
  mock?: boolean;
}

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function resolveModel(model?: string): string {
  const requested = model ?? process.env.ANTHROPIC_MODEL ?? "sonnet";
  const aliases: Record<string, string> = {
    sonnet: DEFAULT_MODEL,
    haiku: "claude-haiku-4-5",
    opus: "claude-opus-4-8"
  };
  return aliases[requested] ?? requested;
}

export function createModelProvider(options: ProviderOptions): ModelProvider {
  if (options.mock) return new MockModelProvider(resolveModel(options.model));
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for real Claude runs. Use --mock for deterministic local/demo mode.");
  }
  return new AnthropicModelProvider(apiKey, resolveModel(options.model));
}

export class MockModelProvider implements ModelProvider {
  constructor(public readonly model = "mock-sonnet") {}

  async selectSkill(prompt: string, catalog: SkillCatalogItem[]): Promise<SkillSelection> {
    const explicit = explicitSkillFromPrompt(prompt, catalog);
    if (explicit) return { skillName: explicit, reason: "Explicit skill mention", source: "explicit" };

    const lower = prompt.toLowerCase();
    if (/\b(new here|new to this|new to the project|first day|get oriented|welcome me|what should i do)\b/.test(lower)) {
      return { skillName: "welcome-me", reason: "User asks for onboarding or welcome guidance", source: "mock" };
    }
    if (/\b(create|draft|generate|write|repair|normalize|package|validate|improve|evolve)\b/.test(lower) && /\bskill|skill\.md|agent skill\b/.test(lower)) {
      return { skillName: "skill-creator", reason: "User asks to create, repair, validate, or improve a skill", source: "mock" };
    }
    if (/\b(code review|review feedback|reviewer|external feedback|yagni|push back)\b/.test(lower)) {
      return { skillName: "receiving-code-review", reason: "User asks to evaluate review feedback", source: "mock" };
    }
    return { skillName: null, reason: "No installed skill is clearly relevant", source: "none" };
  }

  async respond(prompt: string, _catalog: SkillCatalogItem[], activatedSkills: Skill[]): Promise<ModelResponse> {
    const names = activatedSkills.map((skill) => skill.name);
    if (names.includes("welcome-me")) {
      return { text: [
        "> Welcome to our Command Code assignment agent!",
        "",
        "Welcome aboard. Start with `README.md`, then run `npm run skills:doctor` to see the active skill catalog and `npm run skills:eval` to confirm trigger behavior. Try `npm run start -- \"what's the weather?\" --trace --mock` to verify unrelated prompts do not load the welcome skill."
      ].join("\n") };
    }
    if (names.includes("skill-creator")) {
      return { text: [
        "I would draft this as a generated skill first, not install it immediately.",
        "",
        "Recommended flow:",
        "1. Create `.generated-skills/<skill-name>/SKILL.md` with valid frontmatter.",
        "2. Add positive and negative trigger evals.",
        "3. Run `npm run skills:doctor` and `npm run skills:eval`.",
        "4. Install only after explicit approval with `npm run skills:install <skill-name>`."
      ].join("\n") };
    }
    if (names.includes("receiving-code-review")) {
      if (prompt.includes("<local_file_context>")) {
        return { text: [
          "I reviewed the local file context provided by the CLI.",
          "",
          "Findings:",
          "- The review is bounded to the files included in `<local_file_context>`.",
          "- No shell commands or unprovided files were inspected.",
          "- For a real review, focus on behavioral risks, project requirements, and whether lazy skill loading remains intact."
        ].join("\n") };
      }
      return { text: [
        "Verify the feedback before implementing it.",
        "",
        "Restate the technical requirement, check it against the codebase, reject YAGNI or incorrect suggestions, and implement one verified item at a time with tests."
      ].join("\n") };
    }
    if (prompt.includes("<local_file_context>")) {
      return { text: [
        "I reviewed the local file context provided by the CLI.",
        "",
        "This review is bounded to the files included in `<local_file_context>`; no shell commands or unprovided files were inspected.",
        "",
        "Findings:",
        "- The provided file context is readable enough for a bounded review.",
        "- For a deeper project review, provide a specific file or folder and enable `--trace` to see exactly what was loaded.",
        "",
        "Potential skill opportunities:",
        "- `Create a skill for reviewing TypeScript validation and normalization files`",
        "- `Create a skill for auditing project workflow opportunities from selected repo files`",
        "",
        "No installed skill was required for this bounded review. If this should become a repeatable workflow, ask: `Create a skill for reviewing project folders`."
      ].join("\n") };
    }
    if (looksLikePastedCodeReview(prompt)) {
      return { text: [
        "I reviewed the pasted code as user-provided context.",
        "",
        "Findings:",
        "- The review is bounded to the pasted snippet; no files or shell commands were inspected.",
        "- The snippet should be checked for type correctness, validation coverage, and whether repeated normalization logic deserves a reusable review workflow.",
        "",
        "Potential skill opportunities:",
        "- `Create a skill for reviewing TypeScript validation and normalization files`",
        "- `Create a skill for finding workflow-specific review checks in a codebase`"
      ].join("\n") };
    }
    if (prompt.toLowerCase().includes("weather")) {
      return { text: [
        "I don't have live weather tools in this mini-agent. The important part here is that no unrelated skill was loaded.",
        "",
        "If you wanted repeated weather behavior, this agent could draft a gated skill for it, but it would not install or load that skill automatically."
      ].join("\n") };
    }
    return { text: "No installed skill was needed for that prompt. I can still answer normally. If this becomes a recurring workflow, ask me to create a skill for it and I will draft it behind the generated-skill gate." };
  }
}

export class AnthropicModelProvider implements ModelProvider {
  private client: Anthropic;

  constructor(apiKey: string, public readonly model = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
  }

  async selectSkill(prompt: string, catalog: SkillCatalogItem[]): Promise<SkillSelection> {
    const explicit = explicitSkillFromPrompt(prompt, catalog);
    if (explicit) return { skillName: explicit, reason: "Explicit skill mention", source: "explicit" };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: buildSelectionSystemPrompt(catalog),
      tools: [
        {
          name: "activate_skill",
          description: "Activate exactly one installed skill when it is clearly relevant to the user's prompt.",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", enum: catalog.map((skill) => skill.name) },
              reason: { type: "string" }
            },
            required: ["name", "reason"]
          }
        }
      ],
      messages: [{ role: "user", content: prompt }]
    });

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "activate_skill") {
        const input = block.input as { name?: string; reason?: string };
        if (input.name && catalog.some((skill) => skill.name === input.name)) {
          return { skillName: input.name, reason: input.reason ?? "Model activated skill", source: "model", usage: normalizeUsage(response.usage) };
        }
      }
    }

    return { skillName: null, reason: "Model did not activate a skill", source: "none", usage: normalizeUsage(response.usage) };
  }

  async respond(prompt: string, catalog: SkillCatalogItem[], activatedSkills: Skill[]): Promise<ModelResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1400,
      system: buildResponseSystemPrompt(catalog, activatedSkills),
      messages: [{ role: "user", content: prompt }]
    });
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return { text, usage: normalizeUsage(response.usage) };
  }
}

function normalizeUsage(usage: unknown): ApiTokenUsage | undefined {
  if (!usage || typeof usage !== "object") return undefined;
  const record = usage as Record<string, unknown>;
  const inputTokens = numberValue(record.input_tokens);
  const outputTokens = numberValue(record.output_tokens);
  if (inputTokens === undefined || outputTokens === undefined) return undefined;
  return {
    inputTokens,
    outputTokens,
    cacheCreationInputTokens: numberValue(record.cache_creation_input_tokens),
    cacheReadInputTokens: numberValue(record.cache_read_input_tokens)
  };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function explicitSkillFromPrompt(prompt: string, catalog: SkillCatalogItem[]): string | null {
  const firstToken = prompt.trim().split(/\s+/)[0] ?? "";
  const explicit = firstToken.replace(/^[@/]/, "");
  if (explicit && catalog.some((skill) => skill.name === explicit)) return explicit;
  return null;
}

function looksLikePastedCodeReview(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const asksForReview = /\breview|assess|audit|inspect\b/.test(lower);
  const hasCodeShape = /\b(import|export|function|interface|const|let|type)\b|[{};]/.test(prompt);
  return asksForReview && hasCodeShape;
}
