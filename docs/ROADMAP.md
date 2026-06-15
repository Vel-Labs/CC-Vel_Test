# Roadmap

This repo is intentionally scoped as a compact implementation. The remaining work below describes how to turn the concept into a fuller self-improving skill workbench.

## Before publish

- Run `npm install`, `npm run check`, and the real Claude demo with `ANTHROPIC_API_KEY`.
- Verify the real Sonnet selector activates `welcome-me` for several onboarding phrasings.
- Verify the real Sonnet selector does not activate `welcome-me` for weather or generic prompts.
- Review generated zip contents and empty `.skill-usage/ledger.jsonl` before publish.
- Confirm `docs/IMPLEMENTATION_NOTES.md` reflects the final local dogfooding pass.

## Short-term polish

- Add an explicit `read_skill_resource` tool to the live Claude loop so activated skills can request reference files without eager loading.
- Add a guarded `run_skill_script` tool that only runs scripts from activated, trusted skills.
- Add richer trigger eval scoring with both mock and live Sonnet modes.
- Add a `--json-trace` option for reviewer automation.
- Add collision handling for installing generated skills over existing active skills.

## Skill evolution roadmap

- Replace fixture-based `skills:evolve` with ledger mining over `.skill-usage/ledger.jsonl`.
- Cluster repeated prompt patterns and suggest draft skills only after a configurable threshold.
- Add held-out eval generation for each drafted skill.
- Require eval improvement before accepting an evolution edit.
- Store rejected edits in a lightweight buffer so the agent avoids repeating failed changes.
- Add human review diffs before install.

## Production-hardening roadmap

- Add a trust policy for project-level skills from untrusted repositories.
- Add sandboxing and timeout controls for scripts.
- Add file permission boundaries for generated and installed skills.
- Add support for `.agents/skills/` as an optional compatibility scan path.
- Add package/export support for sharing generated skills.
