import path from "node:path";
import { readText, pathExists } from "../lib/fs.js";
import { discoverActiveSkills, toCatalog } from "./discover-skills.js";
import { MockModelProvider } from "../agent/model-provider.js";

interface TriggerCase {
  prompt: string;
  expectedSkill: string | null;
}

export async function runSkillEvals(repoRoot: string): Promise<string> {
  const skills = await discoverActiveSkills(repoRoot);
  const catalog = toCatalog(skills);
  const provider = new MockModelProvider();
  const lines: string[] = [];
  let total = 0;
  let passed = 0;

  lines.push("Skill Trigger Evals");
  lines.push("===================");
  lines.push("Deterministic evals use the mock selector so this can run without an API key.");
  lines.push("");

  for (const skill of skills) {
    const evalPath = path.join(skill.rootDir, "evals", "trigger-cases.json");
    if (!pathExists(evalPath)) continue;
    const cases = JSON.parse(await readText(evalPath)) as TriggerCase[];
    lines.push(skill.name);
    lines.push("-".repeat(skill.name.length));
    for (const testCase of cases) {
      total += 1;
      const selection = await provider.selectSkill(testCase.prompt, catalog);
      const ok = selection.skillName === testCase.expectedSkill;
      if (ok) passed += 1;
      lines.push(`${ok ? "✓" : "✗"} ${JSON.stringify(testCase.prompt)} -> ${selection.skillName ?? "none"} (expected ${testCase.expectedSkill ?? "none"})`);
    }
    lines.push("");
  }

  lines.push(`Result: ${passed}/${total} passing`);
  if (passed !== total) {
    lines.push("At least one trigger eval failed. Tune skill descriptions or selector heuristics before publish.");
  }
  return lines.join("\n");
}
