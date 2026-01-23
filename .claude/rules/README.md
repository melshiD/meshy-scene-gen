# Claude Rules Directory

> Organize your CLAUDE.md instructions into focused, maintainable files

## How It Works

Instead of one large CLAUDE.md, you can split rules into multiple files in `.claude/rules/`:

```
.claude/
├── CLAUDE.md              # Main project overview (still used)
└── rules/
    ├── coding-standards.md
    ├── testing-rules.md
    ├── security-rules.md
    ├── git-workflow.md
    └── domain-specific.md
```

All files in `rules/` are automatically loaded into Claude's context.

## Benefits

- **Easier maintenance** - Edit specific rules without touching others
- **Team collaboration** - Different team members own different rule files
- **Conditional loading** - Rules can be toggled per environment
- **Version control** - Track changes to specific rule categories

## Example Files

### coding-standards.md
```markdown
# Coding Standards

## TypeScript
- Strict mode, no `any`
- Prefer interfaces over types
- Explicit return types on exports

## React
- Functional components only
- Custom hooks for reusable logic
- Prop types via interfaces
```

### testing-rules.md
```markdown
# Testing Rules

## Requirements
- All new code must have tests
- Minimum 80% coverage on business logic
- E2E tests for critical user flows

## Patterns
- Use describe/it structure
- One assertion per test when possible
- Mock external dependencies
```

### security-rules.md
```markdown
# Security Rules

## Never Do
- Hardcode secrets
- Use eval() or Function()
- Trust user input without validation
- Log sensitive data

## Always Do
- Parameterize SQL queries
- Sanitize HTML output
- Validate on server, not just client
- Use HTTPS for external calls
```

## Usage in CLAUDE.md

Reference rules from your main CLAUDE.md:

```markdown
# Project: My App

See `.claude/rules/` for detailed guidelines:
- `coding-standards.md` - How to write code
- `testing-rules.md` - Testing requirements
- `security-rules.md` - Security checklist
```
