#!/usr/bin/env python3
"""Initialize a draft Agent Skill directory."""
from pathlib import Path
import re
import sys

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

TEMPLATE = """---
name: {name}
description: TODO: Describe what this skill does and when to use it.
---
# {title}

## Overview

TODO: Explain the workflow this skill enables.

## When to Use

- TODO: Add positive trigger examples.
- TODO: Add negative trigger examples.

## Process

1. TODO: Add the first deterministic step.
2. TODO: Add validation or review checks.
3. TODO: Add output expectations.

## Resources

- `references/` stores detailed guidance loaded only when needed.
- `scripts/` stores deterministic helpers.
- `assets/` stores templates or output resources.
"""


def title_case(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split("-"))


def main():
    if len(sys.argv) != 4 or sys.argv[2] != "--path":
        print("Usage: init_skill.py <skill-name> --path <parent-dir>")
        raise SystemExit(1)

    name = sys.argv[1]
    parent = Path(sys.argv[3])
    if not NAME_RE.match(name):
        print("❌ Skill name must be hyphen-case lowercase letters, digits, and hyphens")
        raise SystemExit(1)

    root = parent / name
    if root.exists():
        print(f"❌ Skill already exists: {root}")
        raise SystemExit(1)

    (root / "scripts").mkdir(parents=True)
    (root / "references").mkdir()
    (root / "assets").mkdir()
    (root / "evals").mkdir()
    (root / "SKILL.md").write_text(TEMPLATE.format(name=name, title=title_case(name)), encoding="utf-8")
    (root / "references" / "README.md").write_text("# Reference\n\nAdd focused reference material here.\n", encoding="utf-8")
    (root / "evals" / "trigger-cases.json").write_text("[]\n", encoding="utf-8")
    print(f"✅ Initialized {root}")


if __name__ == "__main__":
    main()
