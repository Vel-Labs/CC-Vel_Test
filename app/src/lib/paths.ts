import path from "node:path";
import { existsSync } from "node:fs";

export function findRepoRoot(start = process.cwd()): string {
  let current = path.resolve(start);
  while (true) {
    if (existsSync(path.join(current, "package.json")) && existsSync(path.join(current, ".skills"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(start);
    }
    current = parent;
  }
}

export function activeSkillsDir(repoRoot: string): string {
  return path.join(repoRoot, ".skills");
}

export function generatedSkillsDir(repoRoot: string): string {
  return path.join(repoRoot, ".generated-skills");
}

export function usageLedgerPath(repoRoot: string): string {
  return path.join(repoRoot, ".skill-usage", "ledger.jsonl");
}
