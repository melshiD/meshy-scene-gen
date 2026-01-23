---
name: hookify-templates
description: Ready-to-use hookify rule templates for common patterns
context: fork
model: haiku
requires_plugin: hookify@claude-plugins-official
---

# Hookify Templates

Pre-built hookify rules for common development patterns. Copy these to your `.claude/` directory or use `/hookify` to create similar rules.

## Plugin Installation

```bash
/plugin marketplace add anthropics/claude-plugins-official
/plugin install hookify@claude-plugins-official
```

## Quick Start

```bash
# Create rule from description
/hookify Warn me when using console.log

# List all rules
/hookify:list

# Enable/disable rules
/hookify:configure
```

---

## Security Rules

### Block Dangerous Commands

```yaml
# .claude/hookify.block-dangerous.local.md
---
name: block-dangerous-commands
enabled: true
event: bash
pattern: rm\s+-rf\s+[/~]|dd\s+if=|mkfs|format\s+[A-Z]:|chmod\s+777
action: block
---

**Dangerous command blocked!**

This command could cause data loss or security issues:
- `rm -rf /` or `rm -rf ~` - deletes critical files
- `dd if=` - raw disk operations
- `mkfs` / `format` - filesystem destruction
- `chmod 777` - world-writable permissions

Please use a safer alternative.
```

### Warn on Secrets in Code

```yaml
# .claude/hookify.warn-secrets.local.md
---
name: warn-hardcoded-secrets
enabled: true
event: file
pattern: (API_KEY|SECRET|PASSWORD|TOKEN|PRIVATE_KEY)\s*[=:]\s*["'][^"']{8,}
action: warn
---

**Potential hardcoded secret detected!**

Use environment variables instead:
```javascript
// Bad
const API_KEY = "sk-1234567890"

// Good
const API_KEY = process.env.API_KEY
```

Ensure this file is in `.gitignore` if secrets are intentional.
```

### Block Force Push to Main

```yaml
# .claude/hookify.block-force-push.local.md
---
name: block-force-push-main
enabled: true
event: bash
pattern: git\s+push\s+.*--force.*\s+(main|master)|git\s+push\s+--force\s+(origin\s+)?(main|master)
action: block
---

**Force push to main/master blocked!**

This could overwrite team members' work. Alternatives:
- `git push --force-with-lease` (safer, checks for upstream changes)
- Create a PR instead of force pushing
- Coordinate with team before rewriting shared history
```

---

## Code Quality Rules

### Warn on Debug Code

```yaml
# .claude/hookify.warn-debug.local.md
---
name: warn-debug-code
enabled: true
event: file
pattern: console\.log\(|debugger;|print\(.*#\s*debug|binding\.pry|byebug
action: warn
---

**Debug code detected!**

Remember to remove before committing:
- `console.log()` → Use proper logging
- `debugger;` → Remove breakpoint
- `print(...) # debug` → Remove debug print
- `binding.pry` / `byebug` → Remove Ruby debuggers
```

### Warn on TODO Comments

```yaml
# .claude/hookify.warn-todo.local.md
---
name: warn-todo-comments
enabled: true
event: file
pattern: (TODO|FIXME|HACK|XXX|BUG)[\s:]+
action: warn
---

**TODO/FIXME comment detected**

Consider:
- Creating a GitHub issue for tracking
- Addressing it now if small
- Adding a deadline or owner: `TODO(@username): ...`
```

### Block Large Files

```yaml
# .claude/hookify.block-large-writes.local.md
---
name: block-large-file-writes
enabled: true
event: file
conditions:
  - field: new_text
    operator: regex_match
    pattern: ^[\s\S]{50000,}$
action: warn
---

**Large file write detected!**

Files over 50KB may indicate:
- Generated code that shouldn't be committed
- Data files that belong elsewhere
- Missing `.gitignore` entry

Consider if this file should be:
- Generated at build time
- Stored in a data directory
- Excluded from version control
```

---

## Workflow Rules

### Require Tests Before Stop

```yaml
# .claude/hookify.require-tests.local.md
---
name: require-tests-before-stop
enabled: false  # Enable when you want strict TDD
event: stop
action: block
conditions:
  - field: transcript
    operator: not_contains
    pattern: npm test|yarn test|pytest|cargo test|go test|dotnet test
---

**No tests detected in this session!**

Before completing, please run tests:
- Node: `npm test` or `yarn test`
- Python: `pytest`
- Rust: `cargo test`
- Go: `go test ./...`
- .NET: `dotnet test`

This ensures your changes don't break existing functionality.
```

### Require Build Before PR

```yaml
# .claude/hookify.require-build.local.md
---
name: require-build-before-pr
enabled: false  # Enable for CI-like checks
event: bash
pattern: gh\s+pr\s+create|git\s+push.*-u
action: warn
conditions:
  - field: transcript
    operator: not_contains
    pattern: npm run build|yarn build|cargo build|go build|dotnet build
---

**Build not detected before push/PR!**

Consider running build first:
- `npm run build`
- `yarn build`
- `cargo build --release`

This catches compile errors before CI.
```

### Warn on Direct Main Commits

```yaml
# .claude/hookify.warn-main-commit.local.md
---
name: warn-direct-main-commit
enabled: true
event: bash
pattern: git\s+commit.*&&.*git\s+push\s+origin\s+(main|master)|git\s+push\s+origin\s+(main|master)
action: warn
---

**Direct push to main/master detected!**

Consider using a feature branch and PR:
```bash
git checkout -b feature/my-change
git push -u origin feature/my-change
gh pr create
```

This enables code review and CI checks.
```

---

## Framework-Specific Rules

### React: Warn on Direct State Mutation

```yaml
# .claude/hookify.react-state-mutation.local.md
---
name: react-warn-state-mutation
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(jsx|tsx)$
  - field: new_text
    operator: regex_match
    pattern: this\.state\.\w+\s*=|\.push\(|\.pop\(|\.splice\(
action: warn
---

**Potential React state mutation detected!**

Direct state mutation won't trigger re-renders:
```javascript
// Bad
this.state.items.push(newItem)
arr.splice(0, 1)

// Good
this.setState({ items: [...this.state.items, newItem] })
setArr(arr.filter((_, i) => i !== 0))
```
```

### Python: Warn on Bare Except

```yaml
# .claude/hookify.python-bare-except.local.md
---
name: python-warn-bare-except
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.py$
  - field: new_text
    operator: regex_match
    pattern: except\s*:\s*$|except\s+Exception\s*:
action: warn
---

**Broad exception handling detected!**

Catch specific exceptions:
```python
# Bad
except:
except Exception:

# Good
except ValueError:
except (TypeError, KeyError):
```

Broad catches hide bugs and make debugging harder.
```

---

## Usage Tips

### Enable/Disable Rules

Edit the `enabled:` field or use:
```
/hookify:configure
```

### Test Patterns

```python
python3 -c "import re; print(re.search(r'your-pattern', 'test-string'))"
```

### View Active Rules

```
/hookify:list
```

### Create Custom Rule

```
/hookify [describe the behavior you want to prevent or warn about]
```

---

## Recommended Starter Set

For most projects, enable these:
1. `block-dangerous-commands` - Safety
2. `warn-hardcoded-secrets` - Security
3. `warn-debug-code` - Code quality
4. `block-force-push-main` - Git safety

Add framework-specific rules as needed.
