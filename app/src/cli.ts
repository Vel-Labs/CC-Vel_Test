#!/usr/bin/env node
import path from "node:path";
import { loadEnvFile } from "node:process";
import { findRepoRoot } from "./lib/paths.js";
import { pathExists } from "./lib/fs.js";
import { runGuidedDemo } from "./demo/guided-demo.js";
import { runAgent } from "./agent/run-agent.js";
import { runDoctor } from "./skills/doctor.js";
import { runSkillEvals } from "./skills/eval-skills.js";
import { discoverActiveSkills, discoverGeneratedSkills } from "./skills/discover-skills.js";
import { draftSkill } from "./skills/draft-skill.js";
import { evolveSkill } from "./skills/evolve-skill.js";
import { installAllGeneratedSkills, installGeneratedSkill } from "./skills/install-generated-skill.js";
import { runRepairWelcomeDemo } from "./demo/repair-welcome-demo.js";
import { resolveModel } from "./agent/model-provider.js";
import { runInteractiveChat } from "./chat/interactive-chat.js";
import { runReadinessCheck } from "./readiness/check.js";

interface ParsedFlags {
  trace: boolean;
  mock: boolean;
  noPause: boolean;
  force: boolean;
  draftSkill: boolean;
  demo: boolean;
  model?: string;
  evidence?: string;
  remaining: string[];
}

async function main(): Promise<void> {
  const repoRoot = findRepoRoot();
  loadLocalEnv(repoRoot);
  const args = process.argv.slice(2);
  const flags = parseFlags(args);

  if (flags.remaining.length === 0) {
    await runCodeCommand(repoRoot, flags);
    return;
  }

  const [first, second, ...rest] = flags.remaining;
  if (first === "skills") {
    await runSkillsCommand(repoRoot, second, rest, flags);
    return;
  }
  if (first === "demo") {
    await runDemoCommand(repoRoot, second, flags);
    return;
  }
  if (first === "readiness") {
    await runReadinessCommand(repoRoot, second);
    return;
  }
  if (first === "vel") {
    await runVelCommand(repoRoot, second, rest, flags);
    return;
  }
  if (first === "code") {
    await runCodeCommand(repoRoot, flags);
    return;
  }
  if (first === "help" || first === "--help" || first === "-h") {
    printUsage();
    return;
  }
  if (first === "models") {
    console.log(`sonnet -> ${resolveModel("sonnet")}`);
    console.log(`haiku  -> ${resolveModel("haiku")}`);
    console.log(`opus   -> ${resolveModel("opus")}`);
    return;
  }

  const prompt = flags.remaining.join(" ");
  const result = await runAgent({ repoRoot, prompt, trace: flags.trace, mock: flags.mock, model: flags.model });
  console.log(result.output);
  if (flags.draftSkill) {
    if (result.selectedSkill !== "skill-creator") {
      console.log("\nDraft skipped: --draft-skill only writes when skill-creator is the selected skill.");
    } else {
      const draft = await draftSkill(repoRoot, prompt);
      console.log("\n" + draft.report);
    }
  }
  if (flags.trace) {
    console.log("");
    console.log(result.traceText);
  }
}

async function runReadinessCommand(repoRoot: string, command: string | undefined): Promise<void> {
  switch (command) {
    case undefined:
    case "check":
      console.log(await runReadinessCheck(repoRoot));
      return;
    default:
      throw new Error("Unknown readiness command. Try: check");
  }
}

async function runVelCommand(repoRoot: string, command: string | undefined, rest: string[], flags: ParsedFlags): Promise<void> {
  switch (command) {
    case undefined:
    case "code":
      if (flags.demo || rest.includes("--demo")) {
        await runGuidedDemo({ repoRoot, noPause: flags.noPause });
      } else {
        await runCodeCommand(repoRoot, flags);
      }
      return;
    default:
      throw new Error("Unknown vel command. Try: code");
  }
}

async function runCodeCommand(repoRoot: string, flags: ParsedFlags): Promise<void> {
  if (flags.demo) {
    await runGuidedDemo({ repoRoot, noPause: flags.noPause });
    return;
  }
  await runInteractiveChat({ repoRoot, trace: flags.trace, mock: flags.mock, model: flags.model });
}

function loadLocalEnv(repoRoot: string): void {
  const envPath = path.join(repoRoot, ".env");
  if (pathExists(envPath)) loadEnvFile(envPath);
}

async function runSkillsCommand(repoRoot: string, command: string | undefined, rest: string[], flags: ParsedFlags): Promise<void> {
  switch (command) {
    case "list": {
      const active = await discoverActiveSkills(repoRoot);
      const generated = await discoverGeneratedSkills(repoRoot);
      console.log("Active skills:");
      for (const skill of active) console.log(`  - ${skill.name}`);
      console.log("\nGenerated drafts:");
      if (generated.length === 0) console.log("  none");
      for (const skill of generated) console.log(`  - ${skill.name} (not active)`);
      return;
    }
    case "doctor":
      console.log(await runDoctor(repoRoot));
      return;
    case "eval":
      console.log(await runSkillEvals(repoRoot));
      return;
    case "draft": {
      const prompt = rest.join(" ").trim();
      if (!prompt) throw new Error("Usage: npm run skills:draft -- <skill request>");
      const result = await draftSkill(repoRoot, prompt);
      console.log(result.report);
      return;
    }
    case "evolve": {
      const skillName = rest[0];
      if (!skillName) throw new Error("Usage: npm run skills:evolve -- <generated-skill-name> [--evidence path]");
      console.log(await evolveSkill(repoRoot, skillName, flags.evidence));
      return;
    }
    case "install": {
      const skillName = rest[0];
      console.log(skillName ? await installGeneratedSkill(repoRoot, skillName, flags.force) : await installAllGeneratedSkills(repoRoot, flags.force));
      return;
    }
    default:
      throw new Error("Unknown skills command. Try: list, doctor, eval, draft, evolve, install");
  }
}

async function runDemoCommand(repoRoot: string, command: string | undefined, flags: ParsedFlags): Promise<void> {
  switch (command) {
    case undefined:
    case "guided":
      await runGuidedDemo({ repoRoot, noPause: flags.noPause });
      return;
    case "repair-welcome":
      console.log(await runRepairWelcomeDemo(repoRoot));
      return;
    default:
      throw new Error("Unknown demo command. Try: guided, repair-welcome");
  }
}

function printUsage(): void {
  console.log([
    "Vel Code",
    "",
    "Usage:",
    "  npm run start",
    "  npm run start -- \"I'm new to this project, what should I do?\"",
    "  npm run start -- \"what's the weather?\" --trace",
    "  npm run vel:code",
    "",
    "Optional demos:",
    "  npm run demo",
    "  npm run vel:demo",
    "  npm run demo:repair-welcome",
    "  npm run skills:draft -- \"Create a skill for reviewing small TypeScript files\"",
    "  npm run readiness:check"
  ].join("\n"));
}

function parseFlags(args: string[]): ParsedFlags {
  const flags: ParsedFlags = { trace: false, mock: false, noPause: false, force: false, draftSkill: false, demo: false, remaining: [] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--trace") flags.trace = true;
    else if (arg === "--mock") flags.mock = true;
    else if (arg === "--no-pause") flags.noPause = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--demo") flags.demo = true;
    else if (arg === "--draft-skill" || arg === "--write-skill") flags.draftSkill = true;
    else if (arg === "--model") flags.model = args[++i];
    else if (arg.startsWith("--model=")) flags.model = arg.slice("--model=".length);
    else if (arg === "--evidence") flags.evidence = args[++i];
    else if (arg.startsWith("--evidence=")) flags.evidence = arg.slice("--evidence=".length);
    else flags.remaining.push(arg);
  }
  return flags;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
