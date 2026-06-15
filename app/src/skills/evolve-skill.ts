import path from "node:path";
import { generatedSkillsDir } from "../lib/paths.js";
import { pathExists, readText, writeText } from "../lib/fs.js";
import { parseSkillDir } from "./parse-skill.js";
import { validateSkill } from "./validate-skill.js";
import { recordUsage } from "../usage/usage-ledger.js";

interface UsageEvidence {
  skillName: string;
  summary: string;
  observations: string[];
  proposedBoundedEdits: string[];
  heldOutChecks: string[];
}

export async function evolveSkill(repoRoot: string, skillName: string, evidencePath?: string): Promise<string> {
  const skillDir = path.join(generatedSkillsDir(repoRoot), skillName);
  if (!pathExists(skillDir)) {
    throw new Error(`Generated skill not found: ${path.relative(repoRoot, skillDir)}`);
  }
  const sourcePath = evidencePath ?? path.join(repoRoot, "fixtures", "usage", "readability-session.json");
  const evidence = JSON.parse(await readText(sourcePath)) as UsageEvidence;
  const skillPath = path.join(skillDir, "SKILL.md");
  const current = await readText(skillPath);
  const evolved = applyBoundedEvolution(current, evidence);
  await writeText(skillPath, evolved);

  const skill = await parseSkillDir(skillDir);
  const validation = validateSkill(skill);
  await recordUsage(repoRoot, {
    type: "skill.evolved",
    skillName,
    details: { evidencePath: path.relative(repoRoot, sourcePath), validationOk: validation.ok, installed: false }
  });

  return [
    "Skill Evolution Report",
    "======================",
    `skill: ${skillName}`,
    `source evidence: ${path.relative(repoRoot, sourcePath)}`,
    "",
    "Observed:",
    ...evidence.observations.map((item) => `  - ${item}`),
    "",
    "Applied bounded edit:",
    "  - Added/updated Usage-Gated Evolution Notes section.",
    "",
    `Validation: ${validation.ok ? "passed" : "failed"}`,
    "Install status: not installed",
    `To install: npm run skills:install ${skillName}`
  ].join("\n");
}

function applyBoundedEvolution(current: string, evidence: UsageEvidence): string {
  const section = [
    "## Usage-Gated Evolution Notes",
    "",
    `Evidence summary: ${evidence.summary}`,
    "",
    "### Observed Issues",
    "",
    ...evidence.observations.map((item) => `- ${item}`),
    "",
    "### Bounded Improvements",
    "",
    ...evidence.proposedBoundedEdits.map((item) => `- ${item}`),
    "",
    "### Held-Out Checks",
    "",
    ...evidence.heldOutChecks.map((item) => `- ${item}`),
    ""
  ].join("\n");

  if (/## Usage-Gated Evolution Notes[\s\S]*$/m.test(current)) {
    return current.replace(/## Usage-Gated Evolution Notes[\s\S]*$/m, section);
  }
  return `${current.trim()}\n\n${section}`;
}
