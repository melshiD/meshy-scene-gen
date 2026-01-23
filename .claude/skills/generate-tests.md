---
name: generate-tests
description: Auto-generate tests for a file or function
context: fork
model: opus
---

# Generate Tests

Automatically generate comprehensive tests for specified code.

## Input

$ARGUMENTS should specify:
- File path: `src/utils/helpers.ts`
- Function name: `calculateTotal`
- Test type: `unit` | `integration` | `e2e`

## Process

1. **Read Target Code**
   - Parse the file/function
   - Identify inputs, outputs, side effects
   - Find edge cases from types

2. **Analyze Test Requirements**
   - What should be mocked?
   - What edge cases exist?
   - What error conditions?

3. **Generate Test Cases**
   - Happy path
   - Error handling
   - Edge cases (null, empty, boundaries)
   - Type variations

4. **Write Test File**
   - Follow project's test patterns
   - Use project's test framework
   - Match naming conventions

5. **Verify Tests Run**
   - Execute generated tests
   - Fix any issues
   - Ensure all pass

## Output

Creates test file at appropriate location:
- `src/utils/helpers.ts` → `src/utils/helpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './helpers';

describe('calculateTotal', () => {
  describe('happy path', () => {
    it('should calculate total for valid items', () => {
      const items = [{ price: 10, qty: 2 }, { price: 5, qty: 1 }];
      expect(calculateTotal(items)).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('should handle single item', () => {
      expect(calculateTotal([{ price: 10, qty: 1 }])).toBe(10);
    });
  });

  describe('error handling', () => {
    it('should throw for null input', () => {
      expect(() => calculateTotal(null)).toThrow();
    });
  });
});
```

## Report

```markdown
## Test Generation Report

**Target**: src/utils/helpers.ts
**Tests Created**: 8
**Coverage**: 95%

### Test Cases
- ✅ Happy path (2 tests)
- ✅ Edge cases (4 tests)
- ✅ Error handling (2 tests)

### Verification
- All 8 tests passing
- No type errors
```
