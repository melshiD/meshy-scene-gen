# Claude Skills Directory

> Reusable, hot-reloadable skills that extend Claude's capabilities

## What Are Skills?

Skills are like slash commands but more powerful:
- **Hot reload** - Changes take effect immediately without restart
- **Isolated context** - Can run in forked context to avoid pollution
- **Configurable** - Frontmatter for settings
- **Composable** - Skills can call other skills

## Directory Structure

```
.claude/
└── skills/
    ├── analyze-deps.md       # Check dependencies
    ├── generate-tests.md     # Auto-generate tests
    ├── optimize-bundle.md    # Bundle size analysis
    └── db-migrate.md         # Database migrations
```

Skills in `~/.claude/skills/` are available globally.
Skills in `.claude/skills/` are project-specific.

## Skill Format

```markdown
---
name: skill-name
description: What this skill does
context: fork          # Optional: isolate from main context
model: opus            # Optional: override model
tools:                 # Optional: restrict available tools
  - Read
  - Bash
---

# Skill Name

Instructions for what this skill does...

## Input
What the skill expects as input: $ARGUMENTS

## Process
1. Step one
2. Step two

## Output
What the skill returns
```

## Frontmatter Options

| Option | Description |
|--------|-------------|
| `name` | Skill identifier |
| `description` | Shown in skill list |
| `context: fork` | Run in isolated context |
| `model` | Override default model |
| `tools` | Limit available tools |
| `allowed_commands` | Pre-approved bash commands |

## Hot Reloading

Skills reload automatically when modified. To test:
1. Edit a skill file
2. Save
3. Run the skill - changes are immediate

No need to restart Claude!

## Context Forking

Use `context: fork` for skills that:
- Produce lots of output (won't pollute main context)
- Test experimental approaches
- Need isolation from main conversation

```yaml
---
context: fork
---
```

The forked skill runs in its own context and returns only the result.

## Example Skills

See the skill files in this directory for examples:
- `analyze-deps.md` - Dependency analysis
- `generate-tests.md` - Test generation
- `db-migrate.md` - Safe database migrations
