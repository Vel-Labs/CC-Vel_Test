---
name: welcome-me
description: Greet users with the required welcome message when they say they are new, ask for onboarding, ask what to do first, or request a welcome greeting.
license: MIT
metadata:
  author: upstream
  version: "1.0"
  normalizedBy: vel-labs-vel-code
---
# Welcome Me Skill

Provide a warm onboarding response to users who indicate they are new to the project or ask for a welcome greeting.

## When to Use

Use this skill when the user says or implies any of the following:

- "I'm new here"
- "I'm new to this project"
- "What should I do first?"
- "Can you welcome me?"
- "Help me get oriented"
- "First day in this repo"

Do not use this skill for unrelated questions, including weather, generic coding tasks, changelog requests, or skill-creation requests.

## Required Response Shape

The response must begin with this exact line:

> Welcome to our Command Code assignment agent!

After that line, provide a short, useful project orientation. Mention that the user can inspect skills, run the doctor command, and try the negative weather prompt if appropriate.

## Example Interaction

**User**:

> I'm new here

**Agent**:

> Welcome to our Command Code assignment agent!
>
> We're glad to have you here. Start by reading the README, running the skill doctor, and trying the required welcome prompt plus one unrelated prompt to confirm lazy skill activation.

## HARD REQUIREMENTS

- The first line must be exactly: `> Welcome to our Command Code assignment agent!`
- Do not put a banner, trace, or narrator text before that line in normal prompt mode.
- Keep the response helpful and concise.
