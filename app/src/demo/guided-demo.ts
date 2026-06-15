import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runAgent } from "../agent/run-agent.js";
import { draftSkill } from "../skills/draft-skill.js";
import { evolveSkill } from "../skills/evolve-skill.js";
import { runDoctor } from "../skills/doctor.js";
import { runRepairWelcomeDemo } from "./repair-welcome-demo.js";

export interface GuidedDemoOptions {
  repoRoot: string;
  noPause?: boolean;
}

export async function runGuidedDemo(options: GuidedDemoOptions): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const pause = async () => {
    if (!options.noPause) await rl.question("\nPress Enter to continue...");
  };

  try {
    console.log("Vel Code Demo");
    console.log("");
    console.log("This repo starts with exactly three active skills:");
    console.log("  - welcome-me");
    console.log("  - skill-creator");
    console.log("  - receiving-code-review");
    console.log("");
    console.log("Generated skills are drafts until they pass validation and are explicitly installed.");
    await pause();

    console.log("\nSkill lifecycle demo: active catalog check\n");
    console.log(await runDoctor(options.repoRoot));
    await pause();

    console.log("\nCompatibility repair demo: malformed upstream welcome-me fixture\n");
    console.log("The active welcome-me skill is already normalized. This fixture demonstrates repair behavior only.\n");
    console.log(await runRepairWelcomeDemo(options.repoRoot));
    await pause();

    console.log("\nWelcome prompt, run in deterministic mock mode:\n");
    const welcome = await runAgent({
      repoRoot: options.repoRoot,
      prompt: "I'm new to this project, what should I do?",
      trace: true,
      mock: true
    });
    console.log(welcome.output);
    console.log("");
    console.log(welcome.traceText);
    await pause();

    console.log("\nNegative prompt: verify welcome-me is not loaded for unrelated input.\n");
    const weather = await runAgent({
      repoRoot: options.repoRoot,
      prompt: "what's the weather?",
      trace: true,
      mock: true
    });
    console.log(weather.output);
    console.log("");
    console.log(weather.traceText);
    await pause();

    console.log("\nGenerated skill draft demo\n");
    console.log("The skill-creator skill can draft new skills, but drafts stay outside active context.");
    await pause();

    const draftPrompt = "Create a skill for reviewing small TypeScript files for readability, clean-code boundaries, and ~350-line file limits.";
    let draftSkillName = "readable-typescript-review";
    try {
      const draft = await draftSkill(options.repoRoot, draftPrompt);
      draftSkillName = draft.skillName;
      console.log("\n" + draft.report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Generated skill already exists")) throw error;
      console.log("\nGenerated draft already exists: readable-typescript-review");
      console.log("Reusing the existing draft for the evolution demo.");
    }
    await pause();

    console.log("\nUsage-gated skill improvement demo\n");
    console.log(await evolveSkill(options.repoRoot, draftSkillName));
    console.log("\nDemo complete. For the real Claude path, run:");
    console.log("ANTHROPIC_API_KEY=... npm run start -- \"I'm new to this project, what should I do?\"");
  } finally {
    rl.close();
  }
}
