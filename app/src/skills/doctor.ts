import path from "node:path";
import { discoverActiveSkills, discoverGeneratedSkills } from "./discover-skills.js";
import { formatDiagnostics, validateSkill, WELCOME_HEADER } from "./validate-skill.js";
import { flattenResources } from "./resource-index.js";

export async function runDoctor(repoRoot: string): Promise<string> {
  const skills = await discoverActiveSkills(repoRoot);
  const generated = await discoverGeneratedSkills(repoRoot);
  const lines: string[] = [];
  lines.push("Skill Doctor");
  lines.push("============");
  lines.push("");
  lines.push(`Active catalog: ${path.join(repoRoot, ".skills")}`);
  lines.push(`Active skills discovered: ${skills.length}`);
  lines.push("");

  for (const skill of skills) {
    const validation = validateSkill(skill);
    lines.push(`${validation.ok ? "✓" : "✗"} ${skill.name}`);
    lines.push(`  location: ${path.relative(repoRoot, skill.rootDir)}`);
    lines.push(`  parse mode: ${skill.parseMode}`);
    lines.push(`  description: ${skill.description}`);
    const resources = flattenResources(skill.resources);
    lines.push(`  resources: ${resources.length === 0 ? "none" : resources.join(", ")}`);
    if (skill.name === "welcome-me") {
      lines.push(`  required header: ${skill.rawContent.includes(WELCOME_HEADER) ? "present" : "missing"}`);
    }
    lines.push(...formatDiagnostics(validation.diagnostics));
    lines.push("");
  }

  lines.push("Generated skills");
  lines.push("----------------");
  if (generated.length === 0) {
    lines.push("none");
  } else {
    for (const skill of generated) {
      const validation = validateSkill(skill);
      lines.push(`${validation.ok ? "✓" : "✗"} ${skill.name} (draft, not active)`);
      lines.push(`  location: ${path.relative(repoRoot, skill.rootDir)}`);
    }
  }
  lines.push("");
  lines.push("Policy check");
  lines.push("------------");
  lines.push("✓ normal prompt startup discovers active skills from .skills only");
  lines.push("✓ doctor/list/install commands may inspect .generated-skills for diagnostics or explicit installation");
  lines.push("✓ generated skills require explicit install before activation");
  return lines.join("\n");
}
