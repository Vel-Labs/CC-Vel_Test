import { describe, expect, it, beforeEach } from "vitest";
import { makeTempRepo } from "./helpers.js";
import { runAgent } from "../src/agent/run-agent.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("negative skill loading", () => {
  it("does not load welcome-me for weather", async () => {
    const repoRoot = await makeTempRepo();
    const result = await runAgent({ repoRoot, prompt: "what's the weather?", mock: true, trace: true });

    expect(result.selectedSkill).toBeNull();
    expect(result.traceText).toContain("activated: none");
    expect(result.traceText).toContain("loaded full skill bodies: 0");
    expect(result.traceText).toContain("token estimate activated skill body: 0");
    expect(result.tokenAudit.estimated.activatedSkillBody).toBe(0);
  });
});
