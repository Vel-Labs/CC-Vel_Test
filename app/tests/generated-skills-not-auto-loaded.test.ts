import { describe, expect, it, beforeEach } from "vitest";
import { makeTempRepo } from "./helpers.js";
import { draftSkill } from "../src/skills/draft-skill.js";
import { discoverActiveSkills, discoverGeneratedSkills } from "../src/skills/discover-skills.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("generated skill gate", () => {
  it("creates generated skills without adding them to the active catalog", async () => {
    const repoRoot = await makeTempRepo();
    const draft = await draftSkill(repoRoot, "Create a skill for reviewing small TypeScript files");
    const active = await discoverActiveSkills(repoRoot);
    const generated = await discoverGeneratedSkills(repoRoot);

    expect(draft.skillName).toBe("readable-typescript-review");
    expect(active.map((skill) => skill.name)).not.toContain("readable-typescript-review");
    expect(generated.map((skill) => skill.name)).toContain("readable-typescript-review");
  });
});
