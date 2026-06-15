# AGENTS.md

Operational instructions for humans and coding agents working in this repo.

## Mission

Build and preserve a small, inspectable Node.js CLI that demonstrates the Agent Skills lifecycle. Keep the core path boring, reliable, and easy to verify.

## First Read

Before structural changes, read:

1. `README.md` - reviewer quick start.
2. `INDEX.md` - repo map and command surface.
3. `PROJECT_NOTES.md` - demo instructions and project notes.
4. `docs/TEST_MATRIX.md` - behavior coverage.
5. `docs/ARCHITECTURE.md` - runtime flow.

Use `tree.txt` for a quick file map.

## Non-Negotiable Behavior

- Active skill catalog must start with exactly:
  - `welcome-me`
  - `skill-creator`
  - `receiving-code-review`
- Do not scan `.generated-skills/` during normal startup.
- Do not load full skill bodies before activation.
- The welcome prompt must print this exact first visible line:

```text
> Welcome to our Command Code assignment agent!
```

- Weather/unrelated prompts must not load `welcome-me`.
- Generated skills install only through explicit commands.

## Generated Skill Policy

- Generated drafts live in `.generated-skills/`.
- `npm run skills:install` installs all waiting direct generated drafts that pass validation and trigger eval checks.
- `npm run skills:install -- <name>` installs one generated draft.
- Successful install removes the generated draft and copies it into `.skills/`.
- Demo repair fixtures under nested paths such as `.generated-skills/repaired/...` are not direct install candidates.
- Do not run scripts from generated skills until the skill is installed and trusted.

## Editing Rules

- Prefer narrow edits over broad refactors.
- Keep modules focused and roughly under 350 lines where practical.
- Do not change stock active skill bodies unless explicitly required.
- File/path/pasted-code review is base CLI behavior, not a reason to falsely activate an unrelated skill.
- Update `CHANGELOG.md` for meaningful behavior, command, lifecycle, or project-doc changes.
- Runtime telemetry belongs in `.skill-usage/ledger.jsonl`, not in `CHANGELOG.md`.

## Verification

Run these before handoff:

```bash
npm run readiness:check
npm run check
npm run skills:doctor
npm run skills:eval
```

Before final publish, reset local runtime artifacts:

```bash
: > .skill-usage/ledger.jsonl
find .generated-skills -mindepth 1 ! -name .gitkeep -exec rm -rf {} +
```
