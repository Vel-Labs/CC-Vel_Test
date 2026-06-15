#!/usr/bin/env python3
"""Minimal Agent Skill validator used by the skill-creator demo."""
from pathlib import Path
import re
import sys

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_skill(skill_path: str):
    root = Path(skill_path)
    skill_md = root / "SKILL.md"
    if not root.exists() or not root.is_dir():
        return False, f"Skill directory not found: {root}"
    if not skill_md.exists():
        return False, "SKILL.md not found"

    content = skill_md.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        return False, "SKILL.md must start with standalone YAML frontmatter delimiter"

    match = re.match(r"^---\n(?P<frontmatter>.*?)\n---\n(?P<body>.*)$", content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter shape"

    frontmatter = match.group("frontmatter")
    body = match.group("body").strip()
    name_match = re.search(r"^name:\s*(.+)$", frontmatter, re.MULTILINE)
    desc_match = re.search(r"^description:\s*(.+)$", frontmatter, re.MULTILINE)

    if not name_match:
        return False, "Missing required name field"
    if not desc_match:
        return False, "Missing required description field"

    name = name_match.group(1).strip().strip('"')
    description = desc_match.group(1).strip().strip('"')

    if name != root.name:
        return False, f"Skill name '{name}' must match directory '{root.name}'"
    if not NAME_RE.match(name):
        return False, "Skill name must be hyphen-case lowercase letters, digits, and hyphens"
    if not description:
        return False, "Description cannot be empty"
    if len(description) > 1024:
        return False, "Description must be <= 1024 characters"
    if not body:
        return False, "SKILL.md body cannot be empty"

    return True, "Skill is valid"


def main():
    if len(sys.argv) != 2:
        print("Usage: quick_validate.py <skill-dir>")
        raise SystemExit(1)
    ok, message = validate_skill(sys.argv[1])
    print(("✅ " if ok else "❌ ") + message)
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
