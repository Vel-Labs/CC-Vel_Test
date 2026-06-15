import type { Skill, SkillCatalogItem } from "../types.js";
import { renderActivatedSkillForModel, renderCatalogForModel } from "../skills/skill-catalog.js";

export function buildSelectionSystemPrompt(catalog: SkillCatalogItem[]): string {
  return [
    "You are the skill selection phase of a mini Agent Skills CLI.",
    "Decide whether the user's prompt requires one installed skill.",
    "Only call activate_skill when a skill is clearly relevant.",
    "Do not activate welcome-me for unrelated prompts such as weather questions.",
    "Do not activate receiving-code-review merely because the user asks to review a file, folder, path, or pasted code.",
    "Activate receiving-code-review only for review feedback, reviewer comments, proposed changes, YAGNI concerns, or unclear external suggestions.",
    "Do not answer the user's prompt in this phase.",
    "The catalog below contains metadata only, not full skill bodies.",
    "",
    renderCatalogForModel(catalog)
  ].join("\n");
}

export function buildResponseSystemPrompt(catalog: SkillCatalogItem[], activatedSkills: Skill[]): string {
  const activated = activatedSkills.map(renderActivatedSkillForModel).join("\n\n") || "<activated_skills>none</activated_skills>";
  return [
    "You are a small Node.js CLI agent powered by Claude Sonnet.",
    "Follow the Agent Skills progressive-disclosure contract:",
    "- The catalog was loaded as metadata.",
    "- Only activated skill instructions are present below.",
    "- Do not imply that unrelated skill bodies were loaded.",
    "- If local_file_context is present, review only that provided context and say when the snapshot is incomplete.",
    "- If the user asks to review code, files, or folders and local_file_context is present, provide concise findings from that bounded context.",
    "- For code/file/folder reviews, include a short `Potential skill opportunities` section when repeated workflow patterns suggest useful generated skills.",
    "- If the user pasted code directly, review that pasted code as user-provided context without claiming filesystem access.",
    "- Do not invent tool calls, shell commands, or file contents that are not present in local_file_context.",
    "- If no skill is activated, answer normally and do not invent tool access.",
    "- When suggesting commands for this repo, use documented npm scripts such as `npm run skills:doctor`, `npm run skills:eval`, and `npm run start -- \"what's the weather?\" --trace`.",
    "- Refer to the active skill directory as `.skills/`, not `skills/`, and keep responses concise without emoji.",
    "- If the user wants this no-skill workflow to become repeatable, offer the skill-creator path to draft a gated skill.",
    "- If welcome-me is activated, the first line of the response must be exactly: > Welcome to our Command Code assignment agent!",
    "",
    renderCatalogForModel(catalog),
    "",
    activated
  ].join("\n");
}
