# Test Screenshots

This directory contains screenshots captured during browser automation tests.

## Naming Convention

Screenshots follow this naming pattern:

```
{test-name}-{phase}-{YYYY-MM-DD}-{HHMMSS}.png
```

**Examples:**
- `position-x-before-2024-01-25-103045.png` - Before adjusting X position slider
- `position-x-after-increase-2024-01-25-103047.png` - After increasing X position
- `lighting-preset-dropdown-open-2024-01-25-104523.png` - Lighting dropdown open

## Phases

Common phase names:
- `before` - Initial state before the test action
- `after` - State after the test action completes
- `after-increase` - After incrementing a slider
- `after-decrease` - After decrementing a slider
- `dropdown-open` - Dropdown/select menu is open
- `error` - Error state captured
- `success` - Successful test completion
- `initial` - Initial page load
- `final` - Final state at end of multi-step test

## Test Reports

JSON test reports are also saved here:
- `report-{timestamp}.json` - Full test run results with pass/fail status

## Cleanup

Old screenshots are automatically cleaned up to keep only the last 5 per test.
To manually clean up, run:

```bash
# From project root
find public/test-screenshots -name "*.png" -mtime +7 -delete
```

## Running Tests

**Important:** The browser tests use `agent-browser` CLI which only works within Claude Code's terminal environment. Running via `pnpm test:browser` directly will fail.

### From Claude Code (Recommended)

1. Start the dev server on port 3001
2. Open the composer: `agent-browser open http://localhost:3001/composer`
3. Ask Claude to run the browser tests

### Manual Commands

Within Claude Code's terminal:

```bash
# Run all browser tests
npx tsx src/test/browser/runner.ts

# Run only control tests
npx tsx src/test/browser/runner.ts --category controls

# Run with verbose output
npx tsx src/test/browser/runner.ts --verbose
```

### npm Scripts (for documentation - may not work outside Claude Code)

```bash
pnpm test:browser           # All tests
pnpm test:browser:controls  # Control tests
pnpm test:browser:orbit     # Orbit control tests
pnpm test:browser:ui-state  # UI state tests
pnpm test:browser:verbose   # Verbose output
```

## Directory Contents

This directory is git-ignored except for:
- `README.md` - This file
- `.gitkeep` - Ensures directory exists

Screenshots are local-only for debugging and are not committed.
