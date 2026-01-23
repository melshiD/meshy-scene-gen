---
name: analyze-deps
description: Analyze project dependencies for issues
context: fork
model: sonnet
---

# Analyze Dependencies

Scan project dependencies for security vulnerabilities, outdated packages, and unused dependencies.

## Input

$ARGUMENTS can specify:
- `security` - Focus on vulnerabilities
- `outdated` - Check for updates
- `unused` - Find unused packages
- (empty) - Full analysis

## Process

1. **Detect Package Manager**
   - Check for package.json (npm/pnpm/yarn)
   - Check for pyproject.toml/requirements.txt (pip/uv)
   - Check for Cargo.toml (cargo)
   - Check for go.mod (go)

2. **Security Audit**
   ```bash
   # Node
   npm audit --json

   # Python
   pip-audit --format=json

   # Rust
   cargo audit --json
   ```

3. **Check Outdated**
   ```bash
   # Node
   npm outdated --json

   # Python
   pip list --outdated --format=json
   ```

4. **Find Unused** (Node only)
   ```bash
   npx depcheck --json
   ```

5. **Generate Report**

## Output

```markdown
## Dependency Analysis Report

### Security Vulnerabilities
| Package | Severity | Issue | Fix Version |
|---------|----------|-------|-------------|
| lodash  | High     | CVE-X | 4.17.21     |

### Outdated Packages
| Package | Current | Latest | Type |
|---------|---------|--------|------|
| react   | 18.2.0  | 18.3.0 | minor |

### Unused Dependencies
- @types/unused-pkg
- legacy-lib

### Recommendations
1. Run `npm audit fix` to auto-fix 3 vulnerabilities
2. Update react to 18.3.0 for performance improvements
3. Remove 2 unused dependencies to reduce bundle size
```
