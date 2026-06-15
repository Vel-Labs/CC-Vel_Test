import { describe, expect, it, beforeEach } from "vitest";
import { makeTempRepo } from "./helpers.js";
import { runAgent } from "../src/agent/run-agent.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("welcome-me required behavior", () => {
  it("prints the required header as the first line", async () => {
    const repoRoot = await makeTempRepo();
    const result = await runAgent({
      repoRoot,
      prompt: "I'm new to this project, what should I do?",
      mock: true,
      trace: true
    });

    expect(result.selectedSkill).toBe("welcome-me");
    expect(result.output.split("\n")[0]).toBe("> Welcome to our Command Code assignment agent!");
    expect(result.traceText).toContain("loaded unrelated skill bodies: 0");
    expect(result.traceText).toContain("token source: local estimate only");
    expect(result.traceText).toContain("token estimate activated skill body:");
    expect(result.tokenAudit.estimated.activatedSkillBody).toBeGreaterThan(0);
  });
});
