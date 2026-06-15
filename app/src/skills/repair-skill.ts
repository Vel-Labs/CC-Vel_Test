import path from "node:path";
import { writeText } from "../lib/fs.js";
import type { SkillFrontmatter } from "../types.js";
import { parseLenientSkillContent } from "./parse-skill.js";
import { validateSkill } from "./validate-skill.js";
import { parseSkillDir } from "./parse-skill.js";

export interface RepairResult {
  skillName: string;
  outputDir: string;
  outputPath: string;
  strictFailed: boolean;
  recoveredDescription: string;
  validationOk: boolean;
  diagnostics: string[];
}

export async function repairWelcomeFixture(rawContent: string, outputParentDir: string): Promise<RepairResult> {
  const parsed = parseLenientSkillContent(rawContent);
  const outputDir = path.join(outputParentDir, parsed.frontmatter.name);
  const outputPath = path.join(outputDir, "SKILL.md");
  const normalized = renderNormalizedSkill(parsed.frontmatter, reflowCompressedMarkdown(parsed.body));
  await writeText(outputPath, normalized);
  await writeText(path.join(outputDir, "references", "repair-note.md"), repairNote());
  const repaired = await parseSkillDir(outputDir);
  const validation = validateSkill(repaired);

  return {
    skillName: parsed.frontmatter.name,
    outputDir,
    outputPath,
    strictFailed: true,
    recoveredDescription: parsed.frontmatter.description,
    validationOk: validation.ok,
    diagnostics: validation.diagnostics.map((diagnostic) => `${diagnostic.level}: ${diagnostic.message}`)
  };
}

export function renderNormalizedSkill(frontmatter: SkillFrontmatter, body: string): string {
  const lines = ["---", `name: ${frontmatter.name}`, `description: ${frontmatter.description}`];
  if (frontmatter.license) lines.push(`license: ${frontmatter.license}`);
  if (frontmatter.metadata && Object.keys(frontmatter.metadata).length > 0) {
    lines.push("metadata:");
    for (const [key, value] of Object.entries(frontmatter.metadata)) {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push("---", "", body.trim(), "");
  return lines.join("\n");
}

export function reflowCompressedMarkdown(body: string): string {
  return body
    .replace(/\s+(##\s+)/g, "\n\n$1")
    .replace(/\s+(#\s+)/g, "\n\n$1")
    .replace(/\s+-\s+User/g, "\n- User")
    .replace(/\s+-\s+Agent/g, "\n- Agent")
    .replace(/\s+(\*\*User\*\*:)/g, "\n\n$1")
    .replace(/\s+(\*\*Agent\*\*:)/g, "\n\n$1")
    .replace(/\s+(> Welcome to our Command Code assignment agent!)/g, "\n\n$1")
    .replace(/\s+(> We're glad to have you here\.)/g, "\n$1")
    .replace(/\s+(> If you have any questions or need help getting started, feel free to ask!)/g, "\n$1")
    .replace(/(## HARD REQUIREMENTS:)/g, "## HARD REQUIREMENTS\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function repairNote(): string {
  return `# Repair note\n\nThis skill was generated from the upstream compressed welcome-me fixture. The repair preserves recovered metadata and the required welcome header while normalizing frontmatter into standard Agent Skills shape.\n`;
}
