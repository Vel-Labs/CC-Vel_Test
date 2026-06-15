import path from "node:path";
import { listFilesRecursive, pathExists, readText } from "../lib/fs.js";
import type { SkillResourceIndex } from "../types.js";

export async function buildResourceIndex(skillRoot: string): Promise<SkillResourceIndex> {
  const resources: SkillResourceIndex = { scripts: [], references: [], assets: [], evals: [] };
  for (const key of ["scripts", "references", "assets", "evals"] as const) {
    const dir = path.join(skillRoot, key);
    resources[key] = await listFilesRecursive(dir, skillRoot);
  }
  return resources;
}

export function flattenResources(index: SkillResourceIndex): string[] {
  return [...index.scripts, ...index.references, ...index.assets, ...index.evals].sort();
}

export function safeSkillRelativePath(relativePath: string): string {
  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (normalized.startsWith("../") || normalized === ".." || path.isAbsolute(normalized)) {
    throw new Error(`Unsafe skill resource path: ${relativePath}`);
  }
  return normalized;
}

export async function readSkillResource(skillRoot: string, relativePath: string): Promise<string> {
  const safe = safeSkillRelativePath(relativePath);
  const absolute = path.join(skillRoot, safe);
  if (!pathExists(absolute)) {
    throw new Error(`Skill resource not found: ${safe}`);
  }
  return readText(absolute);
}
