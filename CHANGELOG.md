# Changelog

All notable human-authored changes to this project are tracked here.

Runtime skill activation events are not tracked here; see `.skill-usage/ledger.jsonl` for local machine-readable usage telemetry.

## Unreleased

- Changed normal prompt startup to discover skill metadata only, then load the selected `SKILL.md` body after activation.
- Hardened targeted generated-skill installation so path-like or unsafe skill names are rejected before copy/remove operations.
- Kept explicit outside-repo file review supported, but now requires review/read/inspect-style wording and reports outside paths in trace notes.
- Clarified `skills:doctor` generated-skill wording so normal prompt startup is distinct from diagnostic/generated-skill commands.
- Added the missing `skill-creator/LICENSE.txt` companion file to match the upstream registry skill shape.
- Documented that deterministic readiness checks and ledger auditing are local and do not spend Claude tokens.
- Added token-audit trace fields with local estimates in mock/deterministic mode and Anthropic usage capture for live runs.
- Added a local token estimate hint to the interactive thinking loader without making extra model calls.
- Reordered interactive suggested prompts so the required `welcome-me` path is first, followed by the weather negative test and a concrete flawed `welcome-me` file review fixture.
- Added `fixtures/review/broken-welcome-me/SKILL.md` as a human-readable file review target for reviewer demos.
- Added branded Vel Code interactive chat mode with a terminal banner, suggested prompts, and `/help`, `/trace`, `/mock`, `/demo`, and `/exit` commands.
- Added bounded local file-context loading for explicit file/folder review prompts, with trace-visible file counts and paths.
- Added `/paste` chat mode for multi-line code/context and code-review responses that suggest generated-skill opportunities for repeatable workflows.
- Added `npm run readiness:check` and `PROJECT_NOTES.md` for reviewer-facing readiness proof and project notes.
- Consolidated project notes into `PROJECT_NOTES.md` and kept `docs/IMPLEMENTATION_NOTES.md` for granular rationale.
- Shortened `README.md`, added `INDEX.md`, `tree.txt`, and `docs/PUBLISH_CLEANUP.md` for clearer review and handoff.
- Flattened docs under `docs/`, moved roadmap to `docs/ROADMAP.md`, and made the empty usage ledger part of the clean repo state.
- Added a concise README explanation of why the three active skills were chosen.
- Clarified `npm start` versus `npm run start -- "<prompt>"` and documented the generated-skill "Genie Wish" layer.
- Moved mock mode out of the first-run banner and clarified that deterministic checks do not replace live Claude prompts.
- Added an interactive thinking/status display and terminal-native response panels for chat mode while preserving plain one-shot output.
- Made interactive response panels fully boxed and kept the live status line visible briefly even on fast responses.
- Added trace-visible latency timings and reused the active skill catalog plus model provider across interactive chat turns.
- Updated no-skill responses to offer the gated `skill-creator` path for repeatable workflows.
- Added `npm run code`, `npm run vel`, `npm run vel:code`, and `npm run vel:demo` command aliases.
- Changed no-argument `npm run start` to launch Vel Code chat instead of the guided demo.
- Added explicit `npm run demo` for the guided skill lifecycle demo and toned down demo framing.
- Added project-root `.env` loading for real Claude runs while preserving exported shell variables.
- Added trace fields for welcome postcondition status and whether the output was repaired.
- Tightened generated skill installation to require `evals/trigger-cases.json` with at least one positive trigger and one negative trigger.
- Changed no-argument `npm run skills:install` to install all waiting generated drafts while preserving targeted `npm run skills:install -- <name>`.
- Added tests for exact active catalog contents, CLI demo routing, no-args usage behavior, and generated skill install eval gates.
- Added `docs/PROJECT_BRIEF.md` and updated project docs to lead with the core path.

## 0.1.0 - Initial implementation

- Added Node.js TypeScript CLI with one-shot prompt mode and guided demo mode.
- Added active skills: `welcome-me`, `skill-creator`, and `receiving-code-review`.
- Added lazy skill activation with a trace view that reports catalog loading, selected skill, loaded full skill bodies, and unrelated skill body count.
- Added malformed upstream `welcome-me` fixture and deterministic repair demo.
- Added generated-skill drafting, usage-gated skill evolution, and explicit install gate.
- Added skill doctor, trigger evals, and tests for welcome behavior, weather negative case, repair, generated skill gating, and evolution.
