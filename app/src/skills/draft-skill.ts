import path from "node:path";
import { generatedSkillsDir } from "../lib/paths.js";
import { deriveSkillName, sha256Short, titleCaseFromSlug } from "../lib/text.js";
import { pathExists, writeText } from "../lib/fs.js";
import { parseSkillDir } from "./parse-skill.js";
import { validateSkill } from "./validate-skill.js";
import { recordUsage } from "../usage/usage-ledger.js";

export interface DraftSkillResult {
  skillName: string;
  skillDir: string;
  validationOk: boolean;
  installed: false;
  report: string;
}

export async function draftSkill(repoRoot: string, prompt: string): Promise<DraftSkillResult> {
  const name = deriveSkillName(prompt);
  const skillDir = path.join(generatedSkillsDir(repoRoot), name);
  if (pathExists(skillDir)) {
    throw new Error(`Generated skill already exists: ${path.relative(repoRoot, skillDir)}`);
  }

  const title = titleCaseFromSlug(name);
  const description = descriptionFor(name, prompt);
  const content = renderDraftSkill({ name, title, description, prompt });
  await writeText(path.join(skillDir, "SKILL.md"), content);
  await writeText(path.join(skillDir, "references", "code-quality-principles.md"), referenceFor(name));
  await writeText(path.join(skillDir, "evals", "trigger-cases.json"), JSON.stringify(defaultEvalsFor(name), null, 2) + "\n");

  const skill = await parseSkillDir(skillDir);
  const validation = validateSkill(skill);
  await recordUsage(repoRoot, {
    type: "skill.generated",
    skillName: name,
    prompt,
    details: { validationOk: validation.ok, installed: false }
  });

  const report = [
    "Skill Draft Report",
    "==================",
    `skill: ${name}`,
    `location: ${path.relative(repoRoot, skillDir)}`,
    `validation: ${validation.ok ? "passed" : "failed"}`,
    "installed: no",
    "",
    "Generated skills are drafts until explicitly installed.",
    `To install after review: npm run skills:install ${name}`
  ].join("\n");

  return { skillName: name, skillDir, validationOk: validation.ok, installed: false, report };
}

function descriptionFor(name: string, prompt: string): string {
  if (name === "readable-typescript-review") {
    return "Review TypeScript files for readability, small-file boundaries, clean code, meaningful comments, and maintainable structure. Use when the user asks for TypeScript readability or clean-code review.";
  }
  return `Support the reusable workflow requested by: ${prompt.slice(0, 160)}. Use when users ask for this recurring workflow or similar tasks.`;
}

function renderDraftSkill(input: { name: string; title: string; description: string; prompt: string }): string {
  return `---
name: ${input.name}
description: ${input.description}
metadata:
  status: "draft"
  generatedBy: "vel-labs-vel-code"
  sourcePromptHash: "${sha256Short(input.prompt)}"
---
# ${input.title}

## Overview

Provide a focused reusable workflow for the task pattern described by the source prompt.

## When to Use

Use this skill when the user asks for work that matches the skill description. Do not use this skill for unrelated factual questions, weather, or generic chat.

## Process

1. Restate the user's concrete goal.
2. Inspect the relevant files or context before proposing changes.
3. Prefer small, testable layers over broad rewrites.
4. Explain tradeoffs briefly and avoid performative agreement.
5. Produce a concise result with clear next steps.

## Quality Rules

- Keep files under roughly 350 lines where practical.
- Add comments only when they clarify non-obvious intent.
- Prefer naming, structure, and small functions over explanatory comment sprawl.
- Avoid introducing new dependencies unless the benefit is clear.
- When uncertain, state the uncertainty and how to verify it.

## References

Read references/code-quality-principles.md when reviewing code structure or deciding whether to add comments.
`;
}

function referenceFor(name: string): string {
  if (name === "readable-typescript-review") {
    return `# Code quality principles\n\n- Favor human-readable code over clever abstractions.\n- Treat ~350 lines as a useful pressure point, not a hard law.\n- Prefer extraction when a file combines unrelated reasons to change.\n- Comments should explain why, risk, or non-obvious constraints; they should not narrate obvious syntax.\n- Review code by behavior, boundaries, tests, and maintainability.\n`;
  }
  return `# Reference\n\nAdd focused supporting material for this skill here.\n`;
}

function defaultEvalsFor(name: string): Array<{ prompt: string; expectedSkill: string | null }> {
  if (name === "readable-typescript-review") {
    return [
      { prompt: "Review this TypeScript file for readability and clean-code boundaries", expectedSkill: name },
      { prompt: "Can you check whether this file should be split under the 350-line guideline?", expectedSkill: name },
      { prompt: "what's the weather?", expectedSkill: null },
      { prompt: "Create a new skill for writing release notes", expectedSkill: "skill-creator" }
    ];
  }
  return [
    { prompt: `Use ${name} on a realistic task`, expectedSkill: name },
    { prompt: "what's the weather?", expectedSkill: null }
  ];
}
