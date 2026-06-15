# Repository Index

## Reviewer Path

```bash
npm install
npm start
npm run readiness:check
```

Primary project notes: `PROJECT_NOTES.md`.
Human-readable rationale: `docs/IMPLEMENTATION_NOTES.md`.

## Core Runtime

- `app/src/cli.ts` - command router.
- `app/src/agent/run-agent.ts` - skill discovery, selection, response, trace, postconditions.
- `app/src/agent/model-provider.ts` - Claude provider and deterministic mock provider.
- `app/src/agent/system-prompt.ts` - selection and response system prompts.
- `app/src/skills/` - parsing, discovery, validation, evals, generated-skill install.
- `app/src/chat/interactive-chat.ts` - `npm start` interactive chat.

## Skills

- `.skills/welcome-me/` - welcome/onboarding skill.
- `.skills/skill-creator/` - registry skill for gated skill creation.
- `.skills/receiving-code-review/` - registry skill for review-feedback evaluation.
- `.generated-skills/` - generated drafts, ignored during normal startup.

## Proof And Docs

- `PROJECT_NOTES.md` - demo instructions and project notes.
- `docs/PROJECT_BRIEF.md` - project requirements distilled.
- `docs/IMPLEMENTATION_NOTES.md` - granular implementation rationale.
- `docs/TEST_MATRIX.md` - test coverage map.
- `docs/ARCHITECTURE.md` - runtime architecture.
- `CHANGELOG.md` - human-authored behavior history.
- `DECISIONS.md` - key design decisions.
- `docs/ROADMAP.md` - future-looking notes.
- `docs/PUBLISH_CLEANUP.md` - files to consider removing or excluding before publish.
- `tree.txt` - compact file tree.

## Common Commands

| Command | Purpose |
|---|---|
| `npm start` | Open interactive Vel Code chat |
| `npm run start -- "<prompt>"` | Run one prompt |
| `npm run readiness:check` | Deterministic readiness proof |
| `npm run check` | Typecheck and tests |
| `npm run skills:doctor` | Skill catalog and policy diagnostics |
| `npm run skills:eval` | Deterministic trigger evals |
| `npm run demo` | Optional lifecycle demo |
| `npm run skills:install` | Install all waiting generated drafts |
