# Test Matrix

| Requirement / risk | Coverage |
|---|---|
| Active catalog is exactly `welcome-me`, `skill-creator`, `receiving-code-review` | `active-catalog.test.ts` |
| Normal startup can discover active skill metadata without loaded bodies | `active-catalog.test.ts` |
| Required welcome prompt activates `welcome-me` | `welcome-required-header.test.ts` |
| Required welcome output begins with exact header | `welcome-required-header.test.ts` |
| Weather prompt does not activate any skill | `weather-no-skill.test.ts` |
| Trace reports zero unrelated loaded skill bodies | `welcome-required-header.test.ts`, `weather-no-skill.test.ts` |
| Trace reports token-audit estimates without extra model calls in mock mode | `welcome-required-header.test.ts`, `weather-no-skill.test.ts` |
| Weather prompt token audit reports zero activated skill body estimate | `weather-no-skill.test.ts` |
| Upstream malformed welcome fixture fails strict parsing | `malformed-welcome-repair.test.ts` |
| Lenient parser recovers malformed welcome fixture | `malformed-welcome-repair.test.ts` |
| Repair demo writes normalized valid skill | `malformed-welcome-repair.test.ts` |
| Generated skills are not active automatically | `generated-skills-not-auto-loaded.test.ts` |
| Generated skill install fails without trigger evals | `generated-skill-install-gate.test.ts` |
| Generated skill install succeeds only after validation and trigger eval checks | `generated-skill-install-gate.test.ts` |
| Targeted generated skill install rejects path-like unsafe names | `generated-skill-install-gate.test.ts` |
| No-arg generated skill install installs all waiting drafts | `generated-skill-install-gate.test.ts`, `cli-routing.test.ts` |
| Usage-gated evolution applies bounded edit and stays uninstalled | `skill-evolution-gate.test.ts` |
| No-args CLI launches Vel Code chat instead of full trace/demo | `cli-routing.test.ts` |
| Explicit help command prints concise usage/help | `cli-routing.test.ts` |
| `npm run demo` route launches the guided demo path | `cli-routing.test.ts` |
| `npm run readiness:check` prints deterministic readiness summary | `cli-routing.test.ts` |
| Vel Code interactive chat route prints branded terminal banner | `cli-routing.test.ts` |
| Vel Code numbered prompt `1` runs the required welcome prompt | `cli-routing.test.ts` |
| Vel Code numbered prompt `2` runs the weather negative prompt | `cli-routing.test.ts` |
| Vel Code numbered prompt `3` runs the flawed welcome skill file review | `cli-routing.test.ts` |
| Vel Code chat accepts multi-line pasted context | `cli-routing.test.ts` |
| Vel Code demo route launches the guided lifecycle demo | `cli-routing.test.ts` |
| Explicit local file paths are read as bounded review context | `file-context-review.test.ts` |
| Explicit outside-repo file review remains supported when review intent is clear | `file-context-review.test.ts` |
| Outside-repo paths without review intent are skipped and trace-noted | `file-context-review.test.ts` |
| File-context review suggests candidate generated-skill opportunities | `file-context-review.test.ts` |

Manual checks before publish:

```bash
npm start
npm run start -- "I'm new to this project, what should I do?"
npm run start -- "what's the weather?" --trace
npm run start -- "Review fixtures/review/broken-welcome-me/SKILL.md" --trace
npm run readiness:check
npm run check
npm run skills:doctor
npm run skills:eval
npm run demo -- --no-pause
```

Set `ANTHROPIC_API_KEY` in `.env` or the shell before the live `npm start` / `npm run start -- ...` checks. Use `--mock` only for offline diagnostics.
