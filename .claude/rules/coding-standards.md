# Coding Standards

## General Principles

1. **Clarity over cleverness** - Write code others can understand
2. **DRY but not prematurely** - Three occurrences before abstracting
3. **Small functions** - Each function does one thing
4. **Meaningful names** - Variables and functions describe their purpose

## File Organization

- One component/class per file
- Group related files in directories
- Keep files under 300 lines
- Index files export public API

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-profile.ts` |
| Components | PascalCase | `UserProfile` |
| Functions | camelCase | `getUserById` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Interfaces | PascalCase, I-prefix optional | `User` or `IUser` |

## Code Style

- Use consistent formatting (Prettier/Black)
- Prefer explicit over implicit
- Avoid nested ternaries
- Max 3 levels of nesting

## Comments

- Comment "why", not "what"
- No commented-out code
- Update comments when code changes
- Use JSDoc/docstrings for public APIs
