import { describe, expect, it, beforeEach } from "vitest";
import { spawn } from "node:child_process";
import path from "node:path";
import { makeTempRepo } from "./helpers.js";

beforeEach(() => {
  process.env.MINI_AGENT_DISABLE_LEDGER = "1";
});

describe("CLI routing", () => {
  it("launches Vel Code chat for no-args start behavior", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, [], "/exit\n");

    expect(stdout).toContain("Vel Code");
    expect(stdout).toContain("Suggested prompts (enter 1, 2, or 3):");
    expect(stdout).toContain("Required welcome");
    expect(stdout).not.toContain("Skill lifecycle demo: active catalog check");
  });

  it("prints usage for the explicit help command", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["help"]);

    expect(stdout).toContain("Vel Code");
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("npm run start");
    expect(stdout).toContain("npm run start -- \"I'm new to this project, what should I do?\"");
  });

  it("launches the guided demo through the explicit demo command", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["demo", "--no-pause"]);

    expect(stdout).toContain("Vel Code Demo");
    expect(stdout).toContain("Skill lifecycle demo: active catalog check");
    expect(stdout).toContain("Compatibility repair demo");
    expect(stdout).toContain("Generated skill draft demo");
  });

  it("launches Vel Code interactive chat with a branded banner", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["code"], "/exit\n");

    expect(stdout).toContain("Vel Code");
    expect(stdout).toContain("Agent Skills CLI");
    expect(stdout).toContain("Suggested prompts (enter 1, 2, or 3):");
    expect(stdout).toContain("vel>");
  });

  it("runs numbered welcome suggestion from interactive chat", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["code", "--mock"], "1\n/exit\n");

    expect(stdout).toContain("Activated skill: welcome-me");
    expect(stdout).toContain("> Welcome to our Command Code assignment agent!");
    expect(stdout).not.toContain("It looks like you sent just \"1\"");
  });

  it("runs numbered weather negative suggestion from interactive chat", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["code", "--mock"], "2\n/exit\n");

    expect(stdout).toContain("No skill activated");
    expect(stdout).toContain("I don't have live weather tools in this mini-agent.");
    expect(stdout).not.toContain("It looks like you sent just \"2\"");
  });

  it("runs numbered file review suggestion from interactive chat", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["code", "--mock", "--trace"], "3\n/exit\n");

    expect(stdout).toContain("No skill activated");
    expect(stdout).toContain("I reviewed the local file context provided by the CLI.");
    expect(stdout).toContain("local file paths: fixtures/review/broken-welcome-me/SKILL.md");
    expect(stdout).not.toContain("It looks like you sent just \"3\"");
  });

  it("accepts multi-line pasted context in Vel Code chat", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(
      repoRoot,
      ["code", "--mock"],
      ["/paste\n", "Can you review this TypeScript code?\n", "const value: string = 1;\n", "/end\n", "/exit\n"]
    );

    expect(stdout).toContain("Paste code or context. Finish with /end on its own line.");
    expect(stdout).toContain("No skill activated");
    expect(stdout).toContain("Answering normally without loading unrelated skill bodies.");
    expect(stdout).toContain("I reviewed the pasted code as user-provided context.");
    expect(stdout).toContain("Potential skill opportunities");
  });

  it("launches the guided demo through the Vel Code demo route", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["vel", "code", "--demo", "--no-pause"]);

    expect(stdout).toContain("Vel Code Demo");
    expect(stdout).toContain("Skill lifecycle demo: active catalog check");
  });

  it("runs the readiness check", async () => {
    const repoRoot = await makeTempRepo();
    const { stdout } = await runCli(repoRoot, ["readiness", "check"]);

    expect(stdout).toContain("Readiness Check");
    expect(stdout).toContain("✓ active catalog");
    expect(stdout).toContain("✓ welcome prompt");
    expect(stdout).toContain("✓ weather negative prompt");
    expect(stdout).toContain("Result: passed");
  });

  it("bulk-installs generated skills through the no-arg install command", async () => {
    const repoRoot = await makeTempRepo();
    await runCli(repoRoot, ["skills", "draft", "Create a skill for reviewing small TypeScript files"]);
    const { stdout } = await runCli(repoRoot, ["skills", "install"]);

    expect(stdout).toContain("Bulk Skill Install Report");
    expect(stdout).toContain("installed: readable-typescript-review");
    expect(stdout).toContain("generated draft removed: yes");
  });
});

async function runCli(repoRoot: string, args: string[] = [], input?: string | string[]): Promise<{ stdout: string; stderr: string }> {
  const sourceRoot = process.cwd();
  const tsxCli = path.join(sourceRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const cliPath = path.join(sourceRoot, "app", "src", "cli.ts");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCli, cliPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, MINI_AGENT_DISABLE_LEDGER: "1" },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`CLI exited with code ${code}\n${stderr}`));
    });
    if (Array.isArray(input)) {
      void writeInputChunks(child.stdin, input);
    } else if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function writeInputChunks(stdin: NodeJS.WritableStream, chunks: string[]): Promise<void> {
  for (const chunk of chunks) {
    stdin.write(chunk);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  stdin.end();
}
