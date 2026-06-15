---
name: receiving-code-review
description: Evaluate code review feedback before implementing it. Use when handling reviewer comments, unclear suggestions, questionable feedback, YAGNI concerns, or proposed changes to generated skills that require verification before adoption.
metadata:
  source: registry
  normalizedBy: vel-labs-vel-code
---
# Code Review Reception

## Overview

Code review requires technical evaluation, not performative agreement.

Core principle: verify before implementing. Ask before assuming. Prefer technical correctness over social comfort.

## Response Pattern

When receiving review feedback:

1. Read the complete feedback without reacting.
2. Understand the requirement and restate it when helpful.
3. Verify the feedback against codebase reality.
4. Evaluate whether it is technically sound for this codebase.
5. Respond with technical acknowledgment, clarifying questions, or reasoned pushback.
6. Implement one item at a time and test each change.

## Forbidden Responses

Avoid performative agreement such as:

- "You're absolutely right!"
- "Great point!"
- "Excellent feedback!"
- "Let me implement that now" before verification.

Instead, state the requirement, ask specific questions, push back with technical reasoning, or just make the verified change.

## Handling Unclear Feedback

If any item is unclear, stop and ask for clarification before implementing. Partial understanding often creates wrong implementations.

## Source-Specific Handling

### Human partner feedback

Treat as trusted, but still clarify unclear scope.

### External reviewer feedback

Before implementing, check whether the suggestion:

- is technically correct for this codebase,
- breaks existing functionality,
- has a reason for not already being implemented,
- works across supported platforms and versions,
- conflicts with architectural decisions.

## Use With Skill Evolution

For this mini-agent, use this skill to evaluate proposed skill changes before installation:

1. Verify that the usage evidence supports the proposed edit.
2. Prefer bounded add/delete/replace edits over rewrites.
3. Check whether the skill still validates.
4. Check positive and negative trigger cases.
5. Keep generated skills uninstalled until the user explicitly installs them.

## YAGNI Check

If a reviewer asks for a professional feature, first check actual usage. If nothing calls or needs the feature, ask whether to remove or defer it instead of adding complexity.

## Bottom Line

External feedback is a suggestion to evaluate, not an order to follow. Verify, question, then implement.
