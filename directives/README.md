# Directives

SOPs (Standard Operating Procedures) for the 3-layer architecture. Each directive defines:
- **Goal**: What needs to be done
- **Inputs**: What data/context is needed
- **Tools**: Which execution scripts to use
- **Outputs**: What gets created
- **Edge Cases**: Common errors and constraints

## Naming Convention

Use snake_case with descriptive names:
- `scrape_website.md`
- `update_user_profile.md`
- `generate_session_report.md`

## Template

See `_template.md` in this directory for the directive structure, or refer to AGENTS.md (lines 9-13) for the architectural principles.

## Creating Your First Directive

1. Copy `_template.md` to a new file with a descriptive name
2. Fill in each section based on your use case
3. Identify which execution scripts you'll need (or create new ones)
4. Document edge cases and API constraints as you discover them
5. Update the directive after each run with learnings (rate limits, timing, etc.)

## Best Practices

- **Natural language**: Write as if instructing a mid-level employee
- **Comprehensive**: Include all inputs, outputs, and edge cases
- **Living documents**: Update after each run with new learnings
- **Self-annealing**: When something breaks, fix the script AND update the directive
