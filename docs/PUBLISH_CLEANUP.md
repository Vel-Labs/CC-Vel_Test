# Publish Cleanup

This note tracks files that should stay local, empty, or intentionally excluded from public packaging.

## Excluded From Publish

| Path | Reason | Current handling |
|---|---|---|
| `.env` | Local secret-bearing configuration. | Ignored by git. |
| `node_modules/` | Install output. | Ignored by git. |
| Non-empty `.skill-usage/ledger.jsonl` | Local runtime telemetry. | Keep the file present, but empty it before publish. |
| `.generated-skills/*` except `.gitkeep` | Local generated drafts. | Install intentionally or remove before publish; keep `.generated-skills/.gitkeep`. |
| Local audit scratch files | Working notes, not product docs. | Ignored by git via `*_audit.md`. |

## Included Intentionally

| Path | Reason |
|---|---|
| `.skills/` | Active skill catalog used by the CLI. |
| `.skill-usage/README.md` | Documents local ledger behavior. |
| `.skill-usage/ledger.jsonl` | Empty placeholder showing expected ledger location. |
| `.generated-skills/.gitkeep` | Keeps the generated-skill staging directory visible. |
| `fixtures/` | Deterministic review and compatibility fixtures. |
| `docs/TEST_MATRIX.md`, `docs/ARCHITECTURE.md` | Auditability for the project. |

## Final Local Checks

```bash
npm run readiness:check
npm run check
npm run skills:doctor
npm run skills:eval
npm pack --dry-run --json
```
