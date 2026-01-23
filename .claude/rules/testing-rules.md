# Testing Rules

## Test Requirements

- All new features must have tests
- All bug fixes must have regression tests
- Business logic requires 80%+ coverage
- Critical paths require E2E tests

## Test Structure

```
describe('[Unit/Feature Name]', () => {
  describe('[Method/Scenario]', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Naming Tests

Good: `should return user when valid ID provided`
Bad: `test1`, `works`, `getUserById test`

## What to Test

### Always Test
- Happy path (success case)
- Error handling
- Edge cases (null, empty, boundaries)
- User-facing functionality

### Don't Test
- Implementation details
- Third-party libraries
- Trivial code (getters/setters)

## Mocking

- Mock external services (APIs, databases)
- Don't mock what you own (usually)
- Reset mocks between tests
- Prefer dependency injection over global mocks

## Test Performance

- Unit tests: < 100ms each
- Integration tests: < 1s each
- E2E tests: < 30s each
- Run fast tests first
