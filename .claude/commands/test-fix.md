# Run Tests and Fix Failures

Execute test suite and automatically fix any failing tests.

## Process

1. **Run Test Suite**
   ```bash
   npm test  # or: pytest, cargo test, go test ./...
   ```

2. **Analyze Failures**
   - Parse test output
   - Identify failing test names
   - Understand failure reasons

3. **For Each Failure**
   - Read the test code
   - Read the implementation code
   - Determine if it's a test bug or code bug
   - Fix the root cause
   - Re-run the specific test

4. **Verify All Pass**
   - Run full suite again
   - Confirm no regressions
   - Report summary

## Output Format

```
## Test Results

### Initial Run
- Total: X
- Passed: Y
- Failed: Z

### Fixes Applied
1. `test-name` - [what was wrong] - [how fixed]

### Final Run
- All X tests passing ✓

### Notes
- [Any observations or recommendations]
```

## Arguments

$ARGUMENTS can specify:
- Specific test file: "user.test.ts"
- Test pattern: "auth"
- Watch mode: "watch"

## Example Usage

```
/test-fix
/test-fix "user.test.ts"
/test-fix "integration tests only"
```
