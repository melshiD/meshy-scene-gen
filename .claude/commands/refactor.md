# Refactor Code

Restructure code to improve quality without changing behavior.

## Principles

1. **Preserve Behavior** - Tests must pass before and after
2. **Small Steps** - One refactoring at a time
3. **Verify Often** - Run tests after each change
4. **Document Why** - Explain non-obvious changes

## Common Refactorings

### Extract Function
```
When: Code block does one thing, used in multiple places or too long
```

### Extract Variable
```
When: Complex expression needs a name for clarity
```

### Rename
```
When: Name doesn't clearly express purpose
```

### Move
```
When: Function/class belongs in different module
```

### Simplify Conditional
```
When: Nested ifs, complex boolean expressions
```

### Remove Duplication
```
When: Same logic in multiple places
```

## Process

1. **Identify Target**
   - What code needs refactoring?
   - Why does it need refactoring?

2. **Ensure Test Coverage**
   - Run existing tests
   - Add tests if coverage is low

3. **Plan Refactoring**
   - What specific changes?
   - What order?

4. **Execute Incrementally**
   - One change at a time
   - Run tests after each
   - Commit working states

5. **Verify**
   - All tests pass
   - No behavior change
   - Code is cleaner

## Output Format

```
## Refactoring Summary

### Target
[File/function being refactored]

### Reason
[Why this refactoring improves the code]

### Changes Made
1. [Change 1] - [Reason]
2. [Change 2] - [Reason]

### Tests
- Before: X passing
- After: X passing

### Metrics Improvement
- Lines: X → Y
- Complexity: X → Y
```

## Arguments

$ARGUMENTS specifies what to refactor:
- File: "src/utils/helpers.ts"
- Function: "processUserData function"
- Pattern: "extract all magic numbers"
- Goal: "reduce complexity"

## Example Usage

```
/refactor "src/components/UserForm.tsx"
/refactor "simplify the authentication flow"
/refactor "extract validation logic into separate module"
```
