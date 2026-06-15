import path from "node:path";
import { generatedSkillsDir } from "../lib/paths.js";
import { readText } from "../lib/fs.js";
import { parseStrictSkillContent } from "../skills/parse-skill.js";
import { repairWelcomeFixture } from "../skills/repair-skill.js";
import { WELCOME_HEADER } from "../skills/validate-skill.js";

export async function runRepairWelcomeDemo(repoRoot: string): Promise<string> {
  const fixturePath = path.join(repoRoot, "fixtures", "upstream", "welcome-me.raw.md");
  const raw = await readText(fixturePath);
  let strictMessage = "unexpectedly passed";
  try {
    parseStrictSkillContent(raw);
  } catch (error) {
    strictMessage = error instanceof Error ? error.message : String(error);
  }

  const outputParent = path.join(generatedSkillsDir(repoRoot), "repaired");
  const result = await repairWelcomeFixture(raw, outputParent);
  return [
    "Welcome Skill Repair Demo",
    "=========================",
    "",
    `Input: ${path.relative(repoRoot, fixturePath)}`,
    "",
    "Strict parse:",
    `  ✗ failed: ${strictMessage}`,
    "",
    "Lenient parse:",
    `  ✓ recovered name: ${result.skillName}`,
    `  ✓ recovered description: ${result.recoveredDescription}`,
    `  ✓ found required header: ${WELCOME_HEADER}`,
    "",
    "Repair:",
    `  ✓ wrote normalized skill: ${path.relative(repoRoot, result.outputPath)}`,
    "  ✓ preserved behavior and provenance note",
    "",
    "Validation:",
    `  ${result.validationOk ? "✓ passed" : "✗ failed"}`,
    ...(result.diagnostics.length > 0 ? result.diagnostics.map((line) => `  ${line}`) : ["  no diagnostics"])
  ].join("\n");
}
