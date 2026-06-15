#!/usr/bin/env python3
"""Package a validated Agent Skill directory into a zip file."""
from pathlib import Path
import sys
import zipfile
from quick_validate import validate_skill


def main():
    if len(sys.argv) < 2:
        print("Usage: package_skill.py <skill-dir> [output-dir]")
        raise SystemExit(1)

    skill_dir = Path(sys.argv[1]).resolve()
    output_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path.cwd()
    ok, message = validate_skill(str(skill_dir))
    if not ok:
        print(f"❌ Validation failed: {message}")
        raise SystemExit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{skill_dir.name}.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in skill_dir.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(skill_dir.parent))
    print(f"✅ Packaged {target}")


if __name__ == "__main__":
    main()
