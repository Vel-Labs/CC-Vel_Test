# Usage-Gated Skill Evolution

This project includes a minimal version of self-improving skills.

## Loop

```text
observe usage
  ↓
draft a skill with skill-creator
  ↓
validate the skill
  ↓
apply bounded improvements from evidence
  ↓
review the proposed change
  ↓
install only by explicit command
```

## Guardrails

- Generated skills are not active context.
- Generated skills are not installed automatically.
- Evolution edits are bounded additions or replacements, not broad rewrites.
- The ledger provides evidence, but `CHANGELOG.md` records meaningful human-visible changes.

## SkillOpt inspiration

The implementation borrows the pattern of treating skill documents as trainable artifacts that improve through evidence, bounded edits, and validation gates. It does not integrate the full SkillOpt package.
