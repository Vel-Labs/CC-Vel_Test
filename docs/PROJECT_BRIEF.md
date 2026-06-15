# Project Brief

## Project Summary

Build a small Node.js command-line mini-agent that implements the core Agent Skills lifecycle from the open Agent Skills specification. The CLI accepts user prompts, selects relevant skills, and uses Claude Sonnet to respond.

The core path is intentionally narrow: demonstrate skill discovery, progressive disclosure, skill matching, and correct handling of a `welcome-me` skill.

## Core Requirements

- Implement Agent Skills-style discovery and routing closely enough to demonstrate the requested behavior.
- Provide a Node.js CLI powered by Claude Sonnet.
- Include exactly three active skills:
  - `welcome-me`
  - `skill-creator`
  - `receiving-code-review`
- Select `welcome-me` for project-onboarding prompts such as:
  - `I'm new to this project, what should I do?`
  - `new to this project what should i do`
- Do not load `welcome-me` into context for unrelated prompts such as:
  - `what's the weather?`
- Keep the implementation clean, readable, and appropriately scoped for a focused mini-agent.

## Expected Demo Behavior

- A normal onboarding prompt activates `welcome-me`.
- The welcome header is the first user-visible line for the onboarding path.
- An unrelated prompt does not activate or load `welcome-me`.
- The CLI is runnable without requiring users to inspect implementation details first.
- `npm start` opens the Vel Code chat journey.
- Local file-path review is implemented as bounded CLI context, without rewriting stock skill definitions to support it.
- Mock and diagnostic paths make behavior easy to verify without needing a real API key.
- If an Anthropic API key is present, the real Claude Sonnet provider path is testable with the recommended prompts.

## Review Risks

- `welcome-me` must be selected for project-onboarding/new-user prompts.
- `welcome-me` must not be loaded for unrelated prompts.
- The welcome header must match exactly.
- The implementation should show progressive disclosure rather than loading all skill bodies at startup.
- Generated or draft skills should not silently become part of the active catalog.
- Optional demos should be explicit and should not confuse users who expect a direct prompt-driven CLI.

## How This Repo Satisfies The Requirements

- The active skill catalog starts with exactly `welcome-me`, `skill-creator`, and `receiving-code-review`.
- The core path keeps generated skills outside the active catalog.
- `.generated-skills/` is used for draft skills and is not scanned during normal startup.
- Generated skills require explicit validation and an install command before becoming trusted active skills.
- `npm run demo` is an optional demonstration of skill creation and repair, not the core path.
- The malformed `welcome-me` repair demo shows compatibility handling for an upstream-style fixture, not a prerequisite for the active `welcome-me` behavior.
- Usage-assisted skill creation and evolution demonstrate lifecycle thinking while remaining gated and auditable.
- Runtime usage events belong in `.skill-usage/ledger.jsonl`, while meaningful behavior and documentation changes belong in `CHANGELOG.md`.
