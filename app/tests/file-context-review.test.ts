import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { makeTempRepo } from "./helpers.js";
import { runAgent } from "../src/agent/run-agent.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("file context review", () => {
  it("loads explicit local file paths for review prompts", async () => {
    const repoRoot = await makeTempRepo();
    const target = path.join(repoRoot, "README.md");
    const result = await runAgent({
      repoRoot,
      prompt: `Can you review ${target}?`,
      mock: true,
      trace: true
    });

    expect(result.selectedSkill).toBeNull();
    expect(result.traceText).toContain("local files loaded: 1");
    expect(result.traceText).toContain("local file paths: README.md");
    expect(result.output).toContain("bounded to the files included");
    expect(result.output).toContain("Potential skill opportunities");
    expect(result.output).toContain("Create a skill for reviewing project folders");
  });

  it("keeps plain file review as no-skill context even if a provider selects receiving-code-review", async () => {
    const repoRoot = await makeTempRepo();
    const target = path.join(repoRoot, "README.md");
    const result = await runAgent({
      repoRoot,
      prompt: `Review ${target}`,
      trace: true,
      provider: {
        async selectSkill() {
          return { skillName: "receiving-code-review", reason: "Over-broad review match", source: "model" };
        },
        async respond(prompt) {
          return { text: prompt.includes("<local_file_context>") ? "file context reviewed" : "missing context" };
        }
      }
    });

    expect(result.selectedSkill).toBeNull();
    expect(result.traceText).toContain("selection override: receiving-code-review suppressed for plain file/path review");
    expect(result.traceText).toContain("loaded full skill bodies: 0");
    expect(result.output).toBe("file context reviewed");
  });

  it("allows receiving-code-review for explicit review feedback even with file context", async () => {
    const repoRoot = await makeTempRepo();
    const target = path.join(repoRoot, "README.md");
    const result = await runAgent({
      repoRoot,
      prompt: `Review this external feedback about ${target}`,
      trace: true,
      provider: {
        async selectSkill() {
          return { skillName: "receiving-code-review", reason: "External feedback", source: "model" };
        },
        async respond() {
          return { text: "feedback reviewed" };
        }
      }
    });

    expect(result.selectedSkill).toBe("receiving-code-review");
    expect(result.traceText).toContain("loaded full skill bodies: 1");
    expect(result.output).toBe("feedback reviewed");
  });

  it("allows explicitly requested outside-repo file review and flags it in trace notes", async () => {
    const repoRoot = await makeTempRepo();
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-outside-"));
    const outsideFile = path.join(outsideDir, "outside.md");
    await fs.writeFile(outsideFile, "# Outside review target\n\nThis file is intentionally outside the repo.\n");

    const result = await runAgent({
      repoRoot,
      prompt: `Please review ${outsideFile}`,
      mock: true,
      trace: true
    });

    expect(result.traceText).toContain("local files loaded: 1");
    expect(result.traceText).toContain("local file notes: outside repo:");
    expect(result.output).toContain("bounded to the files included");
  });

  it("skips outside-repo paths without explicit review intent", async () => {
    const repoRoot = await makeTempRepo();
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-outside-"));
    const outsideFile = path.join(outsideDir, "outside.md");
    await fs.writeFile(outsideFile, "# Outside review target\n");

    const result = await runAgent({
      repoRoot,
      prompt: `Mentioning ${outsideFile} as a plain reference`,
      mock: true,
      trace: true
    });

    expect(result.traceText).toContain("local files loaded: 0");
    expect(result.traceText).toContain("outside repo requires explicit review intent");
  });
});
