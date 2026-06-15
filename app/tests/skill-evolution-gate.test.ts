import { describe, expect, it, beforeEach } from "vitest";
import { makeTempRepo } from "./helpers.js";
import { draftSkill } from "../src/skills/draft-skill.js";
import { evolveSkill } from "../src/skills/evolve-skill.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("usage-gated skill evolution", () => {
  it("applies a bounded edit to a generated skill", async () => {
    const repoRoot = await makeTempRepo();
    const draft = await draftSkill(repoRoot, "Create a skill for reviewing small TypeScript files");
    const report = await evolveSkill(repoRoot, draft.skillName);

    expect(report).toContain("Skill Evolution Report");
    expect(report).toContain("Validation: passed");
    expect(report).toContain("Install status: not installed");
  });
});
