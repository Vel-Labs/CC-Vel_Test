import { describe, expect, it } from "vitest";
import { makeTempRepo } from "./helpers.js";
import { discoverActiveSkillMetadata, discoverActiveSkills } from "../src/skills/discover-skills.js";

describe("active skill catalog", () => {
  it("contains exactly the three active skills", async () => {
    const repoRoot = await makeTempRepo();
    const active = await discoverActiveSkills(repoRoot);

    expect(active.map((skill) => skill.name)).toEqual([
      "receiving-code-review",
      "skill-creator",
      "welcome-me"
    ]);
  });

  it("can discover active catalog metadata without loading skill bodies", async () => {
    const repoRoot = await makeTempRepo();
    const metadata = await discoverActiveSkillMetadata(repoRoot);

    expect(metadata.map((skill) => skill.name)).toEqual([
      "receiving-code-review",
      "skill-creator",
      "welcome-me"
    ]);
    expect(metadata.every((skill) => skill.body === "")).toBe(true);
    expect(metadata.every((skill) => skill.rawContent === "")).toBe(true);
  });
});
