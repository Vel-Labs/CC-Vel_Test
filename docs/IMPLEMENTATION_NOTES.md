# Implementation Notes

The canonical project notes live in [`../PROJECT_NOTES.md`](../PROJECT_NOTES.md). This file keeps the more granular implementation rationale.

## Review Lens

The audit posture follows the lightweight part of my [THC Methodology](https://github.com/Vel-Labs/thc-methodology): Truth, Hardening, and Clarity. In this repo that means grounding claims in runnable checks, hardening skill-routing gotchas with tests and postconditions, and making traces/ledgers inspectable. This is not presented as a formal THC score or certification; it is just the human review lens I used to keep hidden trust low.

## Scope Discipline

The most important challenge was keeping the core path boring and correct while still showing the larger skill-lifecycle idea.

Important boundaries:

- Startup discovers metadata only.
- Full skill bodies load only after activation.
- Generated skills are drafts until explicitly installed.
- Runtime telemetry goes to `.skill-usage/ledger.jsonl`, not `CHANGELOG.md`.
- The direct one-shot prompt path stays plain so welcome-header smoke tests remain exact.

## Why These Skills

- `welcome-me` proves onboarding routing and the exact first-line response postcondition.
- `receiving-code-review` gives the agent a review discipline before applying feedback.
- `skill-creator` demonstrates the lifecycle idea: recurring work can become reusable, reviewed skills without silently expanding the active catalog.

The creative "Genie Wish" layer stays in the banner and optional demo paths. The normal CLI path remains direct and inspectable.
