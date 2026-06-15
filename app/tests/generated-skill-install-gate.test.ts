import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTempRepo } from "./helpers.js";
import { draftSkill } from "../src/skills/draft-skill.js";
import { installAllGeneratedSkills, installGeneratedSkill } from "../src/skills/install-generated-skill.js";
import { discoverActiveSkills, discoverGeneratedSkills } from "../src/skills/discover-skills.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("generated skill install gate", () => {
  it("fails when trigger evals are missing", async () => {
    const repoRoot = await makeTempRepo();
    const draft = await draftSkill(repoRoot, "Create a skill for reviewing small TypeScript files");
    await fs.rm(path.join(draft.skillDir, "evals", "trigger-cases.json"));

    await expect(installGeneratedSkill(repoRoot, draft.skillName)).rejects.toThrow(/missing evals\/trigger-cases\.json/);
  });

  it("rejects path-like skill names before installing generated drafts", async () => {
    const repoRoot = await makeTempRepo();

    await expect(installGeneratedSkill(repoRoot, "../.skills/welcome-me")).rejects.toThrow(/Unsafe generated skill name/);
    await expect(installGeneratedSkill(repoRoot, "nested/skill")).rejects.toThrow(/Unsafe generated skill name/);
  });

  it("installs only after validation and trigger eval checks pass", async () => {
    const repoRoot = await makeTempRepo();
    const draft = await draftSkill(repoRoot, "Create a skill for reviewing small TypeScript files");
    const report = await installGeneratedSkill(repoRoot, draft.skillName);
    const active = await discoverActiveSkills(repoRoot);

    expect(report).toContain("validation: passed");
    expect(report).toContain("trigger evals: present");
    expect(report).toContain("generated draft removed: yes");
    expect(active.map((skill) => skill.name)).toContain(draft.skillName);
    expect(await fs.stat(draft.skillDir).catch(() => null)).toBeNull();
  });

  it("installs all waiting generated drafts when no name is provided", async () => {
    const repoRoot = await makeTempRepo();
    const draft = await draftSkill(repoRoot, "Create a skill for reviewing small TypeScript files");
    const report = await installAllGeneratedSkills(repoRoot);
    const active = await discoverActiveSkills(repoRoot);
    const generated = await discoverGeneratedSkills(repoRoot);

    expect(report).toContain("Bulk Skill Install Report");
    expect(report).toContain(`installed: ${draft.skillName}`);
    expect(active.map((skill) => skill.name)).toContain(draft.skillName);
    expect(generated.map((skill) => skill.name)).not.toContain(draft.skillName);
  });
});
