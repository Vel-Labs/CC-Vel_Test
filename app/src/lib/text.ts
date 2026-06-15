import crypto from "node:crypto";

export function slugify(input: string, fallback = "generated-skill"): string {
  const slug = input
    .toLowerCase()
    .replace(/typescript|ts/g, "typescript")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug || fallback;
}

export function deriveSkillName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("typescript") && lower.includes("review")) return "readable-typescript-review";
  if (lower.includes("skill") && lower.includes("evol")) return "skill-evolver";
  if (lower.includes("onboarding") || lower.includes("orientation")) return "project-onboarding";
  return slugify(prompt.replace(/^(create|draft|generate|write)\s+(a\s+)?skill\s+(for|about)?/i, ""));
}

export function titleCaseFromSlug(slug: string): string {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function sha256Short(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 12);
}

export function truncate(input: string, max = 120): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(0, max - 1))}…`;
}

export function indent(input: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return input.split("\n").map((line) => (line ? `${pad}${line}` : line)).join("\n");
}
