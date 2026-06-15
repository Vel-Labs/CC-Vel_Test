---
name: skill-creator
description: Guide creation, repair, packaging, and iteration of Agent Skills. Use when users ask to create a new skill, update a skill, repair malformed skill files, draft reusable workflows, or add scripts, references, and assets to a skill.
license: Complete terms in LICENSE.txt
metadata:
  source: registry
  normalizedBy: vel-labs-vel-code
---
# Skill Creator

Create, repair, and improve Agent Skills that extend an agent with specialized knowledge, workflows, deterministic scripts, references, and assets.

## About Skills

Skills are modular packages that provide procedural knowledge for a specific domain or task. A skill consists of a required `SKILL.md` and optional bundled resources:

```text
skill-name/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

## When to Use

Use this skill when the user asks to:

- create a new skill,
- draft a reusable workflow,
- repair or normalize a malformed `SKILL.md`,
- add resources such as `scripts/`, `references/`, or `assets/`,
- improve a skill based on usage evidence,
- package or validate a skill.

## Skill Creation Process

Follow this process in order unless a step is clearly unnecessary:

1. Understand concrete usage examples.
2. Identify reusable resources: scripts, references, and assets.
3. Initialize the skill with a valid directory and `SKILL.md`.
4. Edit the skill using objective, imperative instructions for the future agent.
5. Validate the skill before installation.
6. Iterate based on real usage, failures, and feedback.

## Progressive Disclosure Requirements

Keep the main `SKILL.md` lean. Move detailed reference material into `references/`, deterministic helpers into `scripts/`, and templates or static resources into `assets/`.

Generated skills must not be installed into the active catalog automatically. They must be drafted, validated, reviewed, and explicitly installed.

## Bundled Helpers

- `scripts/init_skill.py` initializes a draft skill directory.
- `scripts/quick_validate.py` validates required frontmatter and naming constraints.
- `scripts/package_skill.py` packages a valid skill into a zip archive.

## Repair Guidance

When repairing malformed skills:

1. Preserve the original in a fixture or provenance reference.
2. Recover `name`, `description`, optional metadata, and body where safe.
3. Normalize frontmatter into standalone YAML delimiters.
4. Preserve hard behavioral requirements exactly.
5. Validate the repaired skill before use.
