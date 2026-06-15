import path from "node:path";
import { activeSkillsDir, generatedSkillsDir } from "../lib/paths.js";
import { listChildDirs, pathExists } from "../lib/fs.js";
import type { Skill, SkillCatalogItem } from "../types.js";
import { parseSkillDir, parseSkillMetadataDir } from "./parse-skill.js";

export async function discoverActiveSkills(repoRoot: string): Promise<Skill[]> {
  return discoverSkillsInDir(activeSkillsDir(repoRoot));
}

export async function discoverActiveSkillMetadata(repoRoot: string): Promise<Skill[]> {
  return discoverSkillsInDir(activeSkillsDir(repoRoot), { metadataOnly: true });
}

export async function discoverGeneratedSkills(repoRoot: string): Promise<Skill[]> {
  return discoverSkillsInDir(generatedSkillsDir(repoRoot));
}

export async function loadSkillByName(repoRoot: string, skillName: string): Promise<Skill> {
  return parseSkillDir(path.join(activeSkillsDir(repoRoot), skillName));
}

export async function discoverSkillsInDir(skillsDir: string, options: { metadataOnly?: boolean } = {}): Promise<Skill[]> {
  const dirs = await listChildDirs(skillsDir);
  const skills: Skill[] = [];
  for (const dir of dirs) {
    if (!pathExists(path.join(dir, "SKILL.md"))) continue;
    try {
      skills.push(options.metadataOnly ? await parseSkillMetadataDir(dir) : await parseSkillDir(dir));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallbackName = path.basename(dir);
      skills.push({
        name: fallbackName,
        description: "",
        rootDir: dir,
        skillMdPath: path.join(dir, "SKILL.md"),
        rawContent: "",
        frontmatter: { name: fallbackName, description: "", raw: {} },
        body: "",
        parseMode: "lenient",
        diagnostics: [{ level: "error", message }],
        resources: { scripts: [], references: [], assets: [], evals: [] }
      });
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function toCatalog(skills: Skill[]): SkillCatalogItem[] {
  return skills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    rootDir: skill.rootDir,
    diagnostics: skill.diagnostics
  }));
}

export function findSkill(skills: Skill[], skillName: string): Skill | undefined {
  return skills.find((skill) => skill.name === skillName);
}
