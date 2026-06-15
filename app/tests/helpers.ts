import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function makeTempRepo(): Promise<string> {
  const sourceRoot = process.cwd();
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-test-"));
  await fs.cp(path.join(sourceRoot, ".skills"), path.join(temp, ".skills"), { recursive: true });
  await fs.cp(path.join(sourceRoot, "fixtures"), path.join(temp, "fixtures"), { recursive: true });
  await fs.copyFile(path.join(sourceRoot, "README.md"), path.join(temp, "README.md"));
  await fs.mkdir(path.join(temp, ".generated-skills"), { recursive: true });
  await fs.mkdir(path.join(temp, ".skill-usage"), { recursive: true });
  await fs.writeFile(path.join(temp, ".skill-usage", "ledger.jsonl"), "");
  await fs.writeFile(path.join(temp, "package.json"), "{}\n");
  return temp;
}
