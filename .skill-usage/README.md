# Skill usage ledger

Runtime usage events are written to `ledger.jsonl` when the CLI runs.

This is intentionally separate from `CHANGELOG.md`:

- `ledger.jsonl` is machine-readable telemetry for repeated task detection, skill draft provenance, and skill evolution experiments.
- `CHANGELOG.md` is human-authored project history and should summarize meaningful changes only.

The ledger is git-ignored by default. Keep sensitive prompts out of commits.
