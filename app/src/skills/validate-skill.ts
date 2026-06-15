import path from "node:path";
import type { Diagnostic, Skill } from "../types.js";

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const WELCOME_HEADER = "> Welcome to our Command Code assignment agent!";

export interface SkillValidationResult {
  ok: boolean;
  diagnostics: Diagnostic[];
}

export function validateSkill(skill: Skill): SkillValidationResult {
  const diagnostics: Diagnostic[] = [...skill.diagnostics];
  const dirName = path.basename(skill.rootDir);

  if (!NAME_RE.test(skill.name)) {
    diagnostics.push({ level: "error", message: "name must be hyphen-case lowercase letters, digits, and hyphens" });
  }
  if (skill.name !== dirName) {
    diagnostics.push({ level: "error", message: `name '${skill.name}' must match parent directory '${dirName}'` });
  }
  if (!skill.description.trim()) {
    diagnostics.push({ level: "error", message: "description is required" });
  }
  if (skill.description.length > 1024) {
    diagnostics.push({ level: "error", message: "description must be <= 1024 characters" });
  }
  if (skill.name.length > 64) {
    diagnostics.push({ level: "error", message: "name must be <= 64 characters" });
  }
  if (!skill.body.trim()) {
    diagnostics.push({ level: "error", message: "body is required" });
  }
  if (skill.name === "welcome-me" && !skill.rawContent.includes(WELCOME_HEADER)) {
    diagnostics.push({ level: "error", message: "welcome-me is missing the required welcome header" });
  }

  const ok = diagnostics.every((diagnostic) => diagnostic.level !== "error");
  return { ok, diagnostics };
}

export function formatDiagnostics(diagnostics: Diagnostic[]): string[] {
  if (diagnostics.length === 0) return ["  ✓ no diagnostics"];
  return diagnostics.map((diagnostic) => {
    const icon = diagnostic.level === "error" ? "✗" : diagnostic.level === "warn" ? "⚠" : "ℹ";
    return `  ${icon} ${diagnostic.message}`;
  });
}
