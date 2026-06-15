# Usage Ledger

The usage ledger is the future substrate for adaptive skill creation.

Location:

```text
.skill-usage/ledger.jsonl
```

The file is intentionally present in the repo as an empty file. Local runs append runtime events; before handoff, reset it to empty:

```bash
: > .skill-usage/ledger.jsonl
```

Each line is a JSON event with fields such as:

```json
{
  "timestamp": "2026-06-11T00:00:00.000Z",
  "type": "skill.selected",
  "skillName": "welcome-me",
  "promptPreview": "I'm new to this project...",
  "promptHash": "abc123",
  "details": {
    "reason": "User asks for onboarding"
  }
}
```

## Why not only CHANGELOG.md?

`CHANGELOG.md` is a human-facing project history. It should describe meaningful changes to behavior, docs, architecture, or active skills.

The ledger is machine-readable evidence. Future `skills:evolve` work can mine it for repeated prompts, failures, and user corrections.

## Privacy stance

The ledger stores prompt previews and hashes, not full transcripts. For stricter use, set:

```bash
MINI_AGENT_DISABLE_LEDGER=1
```
