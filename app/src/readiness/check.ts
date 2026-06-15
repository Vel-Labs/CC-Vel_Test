import fs from "node:fs/promises";
import path from "node:path";
import { runAgent } from "../agent/run-agent.js";
import { discoverActiveSkills, discoverGeneratedSkills } from "../skills/discover-skills.js";
import { runDoctor } from "../skills/doctor.js";
import { runSkillEvals } from "../skills/eval-skills.js";
import { WELCOME_HEADER } from "../skills/validate-skill.js";

const EXPECTED_ACTIVE_SKILLS = ["receiving-code-review", "skill-creator", "welcome-me"];

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export async function runReadinessCheck(repoRoot: string): Promise<string> {
  const previousLedgerSetting = process.env.MINI_AGENT_DISABLE_LEDGER;
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
  const checks: CheckResult[] = [];

  try {
    const active = await discoverActiveSkills(repoRoot);
    const activeNames = active.map((skill) => skill.name);
    checks.push({
      name: "active catalog",
      ok: JSON.stringify(activeNames) === JSON.stringify(EXPECTED_ACTIVE_SKILLS),
      detail: activeNames.join(", ")
    });

    const generated = await discoverGeneratedSkills(repoRoot);
    checks.push({
      name: "generated drafts",
      ok: generated.length === 0,
      detail: generated.length === 0 ? "none active or pending" : generated.map((skill) => skill.name).join(", ")
    });

    const doctor = await runDoctor(repoRoot);
    checks.push({
      name: "skills doctor",
      ok: doctor.includes("Active skills discovered: 3") && doctor.includes("✓ normal prompt startup discovers active skills from .skills only"),
      detail: "doctor policy checks passed"
    });

    const evals = await runSkillEvals(repoRoot);
    checks.push({
      name: "trigger evals",
      ok: evals.includes("Result: 13/13 passing"),
      detail: "13/13 deterministic trigger evals"
    });

    const welcome = await runAgent({
      repoRoot,
      prompt: "I'm new to this project, what should I do?",
      mock: true,
      trace: true
    });
    checks.push({
      name: "welcome prompt",
      ok: welcome.selectedSkill === "welcome-me" && welcome.output.startsWith(WELCOME_HEADER),
      detail: `activated ${welcome.selectedSkill ?? "none"}; first line is required header`
    });
    checks.push({
      name: "welcome trace",
      ok: welcome.traceText.includes("loaded unrelated skill bodies: 0") && welcome.traceText.includes("postcondition: required welcome header present: true"),
      detail: "no unrelated skill bodies; header postcondition true"
    });

    const weather = await runAgent({
      repoRoot,
      prompt: "what's the weather?",
      mock: true,
      trace: true
    });
    checks.push({
      name: "weather negative prompt",
      ok: weather.selectedSkill === null && weather.traceText.includes("loaded full skill bodies: 0"),
      detail: "activated none; loaded full skill bodies: 0"
    });

    checks.push({
      name: "runtime artifacts",
      ok: await noRuntimeArtifacts(repoRoot),
      detail: ".generated-skills has no drafts and .skill-usage/ledger.jsonl is empty"
    });

    const failed = checks.filter((check) => !check.ok);
    const lines = [
      "Readiness Check",
      "===============",
      "",
      ...checks.map((check) => `${check.ok ? "✓" : "✗"} ${check.name}: ${check.detail}`),
      "",
      failed.length === 0 ? "Result: passed" : `Result: failed (${failed.length} check${failed.length === 1 ? "" : "s"})`
    ];

    if (failed.length > 0) {
      lines.push("", "Failed checks:", ...failed.map((check) => `- ${check.name}`));
    }

    return lines.join("\n");
  } finally {
    if (previousLedgerSetting === undefined) {
      delete process.env.MINI_AGENT_DISABLE_LEDGER;
    } else {
      process.env.MINI_AGENT_DISABLE_LEDGER = previousLedgerSetting;
    }
  }
}

async function noRuntimeArtifacts(repoRoot: string): Promise<boolean> {
  const generatedDir = path.join(repoRoot, ".generated-skills");
  const usageDir = path.join(repoRoot, ".skill-usage");
  const ledgerPath = path.join(usageDir, "ledger.jsonl");
  const generatedEntries = await listNames(generatedDir);
  const usageEntries = await listNames(usageDir);
  const ledgerIsEmpty = await isEmptyFile(ledgerPath);
  return generatedEntries.every((name) => name === ".gitkeep") && usageEntries.every((name) => name === "README.md" || name === "ledger.jsonl") && ledgerIsEmpty;
}

async function isEmptyFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size === 0;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return false;
    throw error;
  }
}

async function listNames(dir: string): Promise<string[]> {
  try {
    return (await fs.readdir(dir)).sort();
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return [];
    throw error;
  }
}
