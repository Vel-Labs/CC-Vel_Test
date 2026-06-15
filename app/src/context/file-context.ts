import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, readText } from "../lib/fs.js";

const MAX_FILES = 8;
const MAX_FILE_CHARS = 4000;
const MAX_TOTAL_CHARS = 14000;
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".skill-usage"]);
const SKIP_FILES = new Set([".env", "package-lock.json"]);
const TEXT_EXTENSIONS = new Set([
  ".js",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".toml",
  ".css",
  ".html"
]);

export interface FileContext {
  text: string;
  files: string[];
  notes: string[];
}

export async function collectFileContext(repoRoot: string, prompt: string): Promise<FileContext> {
  const paths = extractPromptPaths(repoRoot, prompt);
  if (paths.length === 0) return { text: "", files: [], notes: [] };

  const files: string[] = [];
  const notes: string[] = [];
  const chunks: string[] = [];
  let totalChars = 0;

  for (const targetPath of paths) {
    if (files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS) break;
    const outsideRepo = !isInsideRepo(repoRoot, targetPath);
    if (outsideRepo && !hasExplicitReviewIntent(prompt)) {
      notes.push(`outside repo requires explicit review intent: ${targetPath}`);
      continue;
    }
    if (!pathExists(targetPath)) {
      notes.push(`missing: ${targetPath}`);
      continue;
    }
    const stat = await fs.stat(targetPath);
    const candidates = stat.isDirectory() ? await listReviewFiles(targetPath, repoRoot) : [targetPath];
    for (const filePath of candidates) {
      if (files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS) break;
      if (!isReviewableFile(filePath)) {
        notes.push(`skipped: ${path.relative(repoRoot, filePath) || filePath}`);
        continue;
      }
      const raw = await readText(filePath);
      const remaining = MAX_TOTAL_CHARS - totalChars;
      const content = raw.slice(0, Math.min(MAX_FILE_CHARS, remaining));
      totalChars += content.length;
      files.push(filePath);
      if (!isInsideRepo(repoRoot, filePath)) {
        notes.push(`outside repo: ${filePath}`);
      }
      chunks.push([
        `<file path="${escapeXml(path.relative(repoRoot, filePath) || filePath)}">`,
        content,
        raw.length > content.length ? "\n[truncated]" : "",
        "</file>"
      ].join("\n"));
    }
  }

  if (files.length === 0) return { text: "", files, notes };
  const text = [
    "<local_file_context>",
    "The CLI already read the explicit local path(s) named by the user. Do not claim to run shell commands or use tools.",
    ...chunks,
    "</local_file_context>"
  ].join("\n");
  return { text, files, notes };
}

function extractPromptPaths(repoRoot: string, prompt: string): string[] {
  const matches = prompt.match(/(?:\/[^\s'"`]+|\.{1,2}\/[^\s'"`]+|[\w.-]+\/[\w./-]+|[\w.-]+\.(?:js|ts|tsx|json|md|txt|yml|yaml|toml|css|html))/g) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    const cleaned = match.replace(/[),.;:!?]+$/g, "");
    const absolute = path.isAbsolute(cleaned) ? cleaned : path.resolve(repoRoot, cleaned);
    unique.add(absolute);
  }
  return [...unique];
}

function hasExplicitReviewIntent(prompt: string): boolean {
  return /\b(review|inspect|audit|read|open|look at|check|analyze|analyse)\b/i.test(prompt);
}

function isInsideRepo(repoRoot: string, targetPath: string): boolean {
  const relative = path.relative(repoRoot, targetPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function listReviewFiles(dir: string, repoRoot: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(current: string): Promise<void> {
    if (results.length >= MAX_FILES) return;
    const base = path.basename(current);
    if (SKIP_DIRS.has(base)) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (results.length >= MAX_FILES) return;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile() && isReviewableFile(absolute)) {
        results.push(absolute);
      }
    }
  }
  await walk(dir);
  return results.sort((a, b) => path.relative(repoRoot, a).localeCompare(path.relative(repoRoot, b)));
}

function isReviewableFile(filePath: string): boolean {
  if (SKIP_FILES.has(path.basename(filePath))) return false;
  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

function escapeXml(input: string): string {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
