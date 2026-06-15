# Project Notes

Vel Code is a small Node.js CLI that demonstrates metadata-first Agent Skills routing with Claude Sonnet.

## Time Spent

Approximately 5.5 hours of focused work:

- 1.5 hours planning, ideation, and scope interpretation.
- 1 hour agentic coding.
- 1 hour initial wrap-up: roughly 30 minutes of agentic audit plus 30 minutes of manual review and dogfooding.
- 2 hours final hardening: adversarial audit comparison, progressive-disclosure tightening, generated-skill install hardening, token-audit trace work, and final verification.

The project structure was also informed by my agentic governance scaffold, [Vel-Labs/project-scaffold](https://github.com/Vel-Labs/project-scaffold). I did not copy the entire scaffold into this repo; I used its operating style: explicit decisions, testable gates, changelog discipline, and reviewable handoff docs.

## Challenges

The tricky parts were mostly in keeping the implementation small while preserving the expected skill lifecycle:

- Implementing progressive disclosure instead of loading every `SKILL.md` into the system prompt.
- Handling the `welcome-me` compatibility edge while keeping the active skill normalized and reliable.
- Using Claude for real skill selection while keeping deterministic mock checks for local verification.
- Enforcing the welcome header as the first visible line.
- Keeping exactly three active skills while putting generated skills behind explicit validation and install gates.
- Treating weather prompts as negative skill-loading tests, not as weather feature requests.
- Making the trace audit useful without adding extra model calls or inflating token usage.

## Demo Instructions

Install dependencies and set `ANTHROPIC_API_KEY` in `.env` or your shell:

```bash
npm install
```

Start the interactive CLI:

```bash
npm start
```

`npm start` is the intended interactive entrypoint. Use `npm run start -- "<prompt>"` only when passing a direct one-off prompt through npm.

Recommended prompt flow:

| Prompt | Expected outcome |
|---|---|
| `I'm new to this project, what should I do?` | Activates `welcome-me` and prints the required welcome header first. |
| `what's the weather?` | Activates no skill; unrelated skill bodies are not loaded. |
| `Review fixtures/review/broken-welcome-me/SKILL.md` | Loads only that flawed fixture as bounded review context and does not activate an unrelated skill. |

Useful commands:

| Command | Purpose |
|---|---|
| `npm start` | Opens the interactive Vel Code chat. |
| `npm run readiness:check` | Runs the deterministic readiness check. |
| `npm run skills:doctor` | Shows active skills, diagnostics, and generated-skill policy checks. |
| `npm run skills:eval` | Runs deterministic trigger evals. |
| `npm run demo` | Runs the optional skill lifecycle demo. |
| `npm run demo:repair-welcome` | Shows the malformed `welcome-me` compatibility fixture repair. |

Optional: inside `npm start`, use `/paste` to provide multi-line code or context. If no installed skill fits, the agent answers normally and may suggest candidate generated skills for repeatable workflows. Those suggestions are not installed automatically.
