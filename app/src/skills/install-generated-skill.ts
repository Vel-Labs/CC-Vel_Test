import fs from "node:fs/promises";
import path from "node:path";
import { activeSkillsDir, generatedSkillsDir } from "../lib/paths.js";
import { copyDir, listChildDirs, pathExists, readText } from "../lib/fs.js";
import { parseSkillDir } from "./parse-skill.js";
import { validateSkill } from "./validate-skill.js";
import { recordUsage } from "../usage/usage-ledger.js";

interface TriggerCase {
  prompt?: unknown;
  expectedSkill?: unknown;
}

const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function installGeneratedSkill(repoRoot: string, skillName: string, force = false): Promise<string> {
  assertSafeSkillName(skillName);
  const src = path.join(generatedSkillsDir(repoRoot), skillName);
  const dest = path.join(activeSkillsDir(repoRoot), skillName);
  if (!pathExists(src)) throw new Error(`Generated skill not found: ${path.relative(repoRoot, src)}`);
  if (pathExists(dest) && !force) throw new Error(`Active skill already exists: ${skillName}. Pass --force to overwrite.`);

  const skill = await parseSkillDir(src);
  const validation = validateSkill(skill);
  if (!validation.ok) {
    throw new Error(`Cannot install invalid skill: ${validation.diagnostics.map((d) => d.message).join("; ")}`);
  }
  await assertInstallEvals(src, skillName);

  await copyDir(src, dest);
  await fs.rm(src, { recursive: true, force: true });
  await recordUsage(repoRoot, { type: "skill.installed", skillName, details: { force } });
  return [
    "Skill Install Report",
    "====================",
    `skill: ${skillName}`,
    `from: ${path.relative(repoRoot, src)}`,
    `to: ${path.relative(repoRoot, dest)}`,
    "validation: passed",
    "trigger evals: present",
    "installed: yes",
    "generated draft removed: yes"
  ].join("\n");
}

function assertSafeSkillName(skillName: string): void {
  if (!SKILL_NAME_RE.test(skillName)) {
    throw new Error(`Unsafe generated skill name: ${skillName}. Use lowercase hyphen-case skill names only.`);
  }
  if (skillName.includes("/") || skillName.includes("\\") || skillName.includes("..") || path.isAbsolute(skillName)) {
    throw new Error(`Unsafe generated skill name: ${skillName}. Path segments are not allowed.`);
  }
}

export async function installAllGeneratedSkills(repoRoot: string, force = false): Promise<string> {
  const generatedDirs = await listChildDirs(generatedSkillsDir(repoRoot));
  const installableNames = generatedDirs
    .filter((dir) => pathExists(path.join(dir, "SKILL.md")))
    .map((dir) => path.basename(dir))
    .sort();

  if (installableNames.length === 0) {
    return [
      "Skill Install Report",
      "====================",
      "generated drafts: none",
      "installed: 0"
    ].join("\n");
  }

  const reports: string[] = [];
  for (const skillName of installableNames) {
    reports.push(await installGeneratedSkill(repoRoot, skillName, force));
  }

  return [
    "Bulk Skill Install Report",
    "=========================",
    `generated drafts found: ${installableNames.length}`,
    `installed: ${installableNames.join(", ")}`,
    "",
    reports.join("\n\n")
  ].join("\n");
}

async function assertInstallEvals(skillDir: string, skillName: string): Promise<void> {
  const evalPath = path.join(skillDir, "evals", "trigger-cases.json");
  if (!pathExists(evalPath)) {
    throw new Error("Cannot install generated skill: missing evals/trigger-cases.json with at least one positive trigger and one negative trigger.");
  }

  let cases: TriggerCase[];
  try {
    const parsed = JSON.parse(await readText(evalPath));
    if (!Array.isArray(parsed)) throw new Error("expected an array");
    cases = parsed as TriggerCase[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot install generated skill: invalid evals/trigger-cases.json (${message}).`);
  }

  const hasPositive = cases.some((testCase) => typeof testCase.prompt === "string" && testCase.expectedSkill === skillName);
  const hasNegative = cases.some((testCase) => typeof testCase.prompt === "string" && testCase.expectedSkill === null);
  if (!hasPositive || !hasNegative) {
    throw new Error("Cannot install generated skill: evals/trigger-cases.json must include at least one positive trigger for this skill and one negative trigger with expectedSkill null.");
  }
}
