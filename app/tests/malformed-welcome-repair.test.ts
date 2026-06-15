import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTempRepo } from "./helpers.js";
import { parseLenientSkillContent, parseStrictSkillContent } from "../src/skills/parse-skill.js";
import { runRepairWelcomeDemo } from "../src/demo/repair-welcome-demo.js";


describe("malformed upstream welcome-me fixture", () => {
  it("fails strict parsing and succeeds lenient recovery", async () => {
    const repoRoot = await makeTempRepo();
    const raw = await fs.readFile(path.join(repoRoot, "fixtures", "upstream", "welcome-me.raw.md"), "utf-8");

    expect(() => parseStrictSkillContent(raw)).toThrow(/frontmatter delimiters/);
    const recovered = parseLenientSkillContent(raw);
    expect(recovered.frontmatter.name).toBe("welcome-me");
    expect(recovered.body).toContain("> Welcome to our Command Code assignment agent!");
  });

  it("writes a normalized repaired skill", async () => {
    const repoRoot = await makeTempRepo();
    const report = await runRepairWelcomeDemo(repoRoot);
    expect(report).toContain("Validation:");
    expect(report).toContain("✓ passed");
  });
});
