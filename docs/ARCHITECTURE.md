# Architecture

## Runtime flow

```text
User prompt
  ↓
Discover active skills from .skills/
  ↓
Read SKILL.md frontmatter metadata only
  ↓
Build catalog from name + description
  ↓
Claude or mock selector chooses zero or one skill
  ↓
Load full SKILL.md body only for the activated skill
  ↓
Claude or mock responder answers
  ↓
Postcondition checks + trace + usage ledger
```

## Progressive disclosure

The CLI deliberately separates three levels of context:

1. **Catalog** — skill names and descriptions available at startup.
2. **Instructions** — full skill body available only after activation.
3. **Resources** — scripts, references, assets, and evals indexed but not loaded into the model by default.

The trace reports this so a reviewer can verify the weather prompt does not send `welcome-me` instructions to the model or load an activated body.

## Token audit

Trace output includes token-audit fields:

```text
token source: local estimate only
token estimate prompt: ...
token estimate catalog metadata: ...
token estimate activated skill body: ...
token estimate selection input: ...
token estimate response input: ...
```

Local estimates use a simple character-based heuristic and do not call a model. Live Claude runs also record Anthropic usage fields from the selection and response API results when available. The interactive thinking line may show a local estimate while Claude is working; that display does not spend extra tokens.

## Active versus generated skills

```text
.skills/              active skill catalog
.generated-skills/    drafts and repaired fixtures, not active by default
.skill-usage/         local machine-readable usage events
```

Generated skills are not scanned during normal startup. Installation is explicit.

## Provider boundary

`ModelProvider` has two implementations:

- `AnthropicModelProvider` for real Claude Sonnet runs.
- `MockModelProvider` for deterministic tests and guided demos.

The mock provider exists so evaluation and optional demos can run without an API key. The live path uses Anthropic when `ANTHROPIC_API_KEY` is set.
