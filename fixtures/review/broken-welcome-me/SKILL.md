--- name: welcome-me description: Welcome new users. ---
# Broken Welcome Skill

This fixture is intentionally malformed for reviewer file-context testing.

## Problems To Notice

- Frontmatter is compressed onto one line instead of using standalone YAML delimiters.
- The required welcome header is missing.
- The description is too vague to make skill selection reliable.
- The response shape does not say that the header must be the first visible line.

## Intended Header

The real installed skill must begin responses with:

> Welcome to our Command Code assignment agent!
