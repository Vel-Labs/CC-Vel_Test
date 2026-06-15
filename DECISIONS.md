# Decisions

## 001 - Keep the active catalog exactly three skills

**Decision:** The active catalog contains `welcome-me`, `skill-creator`, and `receiving-code-review`.

**Why:** The core demo uses `welcome-me` plus two registry-style skills. Generated skills are a value-add, but they are not counted toward the active three and are not loaded by default.

**Result:** The repo can demonstrate the "genie wish" idea without looking like it dodged the instruction.

## 002 — Use `skill-creator` instead of `writing-plans` or `writing-skills`

**Decision:** Do not use `writing-plans` or `writing-skills` as active skills.

**Why:** Both are interesting, but they introduce external `superpowers:*` assumptions that this mini-agent does not implement. The project is about core Agent Skills loading and matching logic, so avoiding sub-skill dependencies makes the demo cleaner.

**Result:** The active skills remain self-contained enough for a reviewer to reason about quickly.

## 003 — Use `receiving-code-review` as the review discipline for skill evolution

**Decision:** Pair `skill-creator` with `receiving-code-review`.

**Why:** Skill generation needs a review gate. `receiving-code-review` provides a concrete mindset: verify, evaluate, push back when technically justified, and avoid performative agreement.

**Result:** Generated skills can be improved from usage evidence without being blindly installed.

## 004 — Normalize the active `welcome-me` skill and preserve the malformed upstream as a fixture

**Decision:** The active `.skills/welcome-me/SKILL.md` is valid Agent Skills frontmatter, while the malformed upstream raw file is preserved at `fixtures/upstream/welcome-me.raw.md`.

**Why:** The required prompt should work immediately. The repair path is still shown as a demo and test fixture.

**Result:** Reviewers get both reliability and a visible gotcha-resolution story.

## 005 — Separate usage ledger from changelog

**Decision:** Store raw runtime events in `.skill-usage/ledger.jsonl`; store meaningful human-authored project history in `CHANGELOG.md`.

**Why:** A changelog should be readable source-of-truth history, not raw telemetry. The ledger is better for future usage-assisted skill generation.

**Result:** The project has both machine-readable evidence and human-readable project narrative.

## 006 — Use a SkillOpt-inspired gate, not a SkillOpt dependency

**Decision:** Do not integrate Microsoft SkillOpt directly. Borrow the pattern: usage evidence, bounded edits, validation gate, staged artifact.

**Why:** Full SkillOpt integration would be too large for this small project. The important idea is the lifecycle, not the dependency.

**Result:** `skills:evolve` applies a small bounded edit from fixture evidence and keeps the skill uninstalled.

## 007 — Make the fourth-wall demo opt-in

**Decision:** `npm run start` with no prompt launches the Vel Code chat journey. `npm run demo` launches the guided lifecycle demo. `npm run start -- "prompt"` runs the plain one-shot CLI.

**Why:** The demo is memorable, but normal CLI output must not put narrator text before the required welcome header. The default CLI should feel like a small coding-agent chat without dumping the full trace or demo path.

**Result:** The repo has an interactive dogfood path and an explicit demo path without compromising the exact grading path.
