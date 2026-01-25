# Browser Test Screenshots

This directory contains screenshots captured during browser automation tests.

---

## Agent-Browser Setup Guide

The browser tests use **agent-browser**, a CLI tool for browser automation. There are two options:

### Option 1: Vercel's agent-browser (Recommended for Tests)

This is a standalone tool that works with Claude Code and other AI CLI tools.

**Installation:**

```bash
# Install globally
npm install -g agent-browser

# Download Chromium browser
agent-browser install

# (Optional) Copy skill to Claude Code for enhanced integration
cp -r node_modules/agent-browser/skills/agent-browser .claude/skills/
```

**Verify Installation:**

```bash
# Check version
agent-browser --version

# Test opening a page
agent-browser open https://example.com

# Get interactive elements
agent-browser snapshot -i
```

**Core Commands:**

| Command | Description |
|---------|-------------|
| `agent-browser open <url>` | Navigate to a page |
| `agent-browser snapshot -i` | List interactive elements with refs |
| `agent-browser click <ref>` | Click element (e.g., `click e1`) |
| `agent-browser type <ref> "text"` | Type into element |
| `agent-browser fill <ref> "text"` | Clear and fill element |
| `agent-browser screenshot <path>` | Save screenshot |
| `agent-browser close` | Close browser |

### Option 2: Claude Code Chrome Integration (Beta)

Uses your existing Chrome browser with the Claude extension.

**Prerequisites:**
- Google Chrome browser
- [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) (v1.0.36+)
- Claude Code CLI (v2.0.73+)
- Paid Claude plan (Pro, Team, or Enterprise)

**Setup:**

```bash
# Update Claude Code
claude update

# Launch with Chrome enabled
claude --chrome

# In the session, run:
/chrome
# Select "Enabled by default" if desired
```

---

## Configuration

### Environment Variables

```bash
# Port for the test dev server (default: 3001)
TEST_PORT=3001
```

### Claude Code Permissions

Add to `.claude/settings.json` if not already present:

```json
{
  "permissions": {
    "allow": [
      "Bash(agent-browser *)"
    ]
  }
}
```

---

## Troubleshooting

### agent-browser Issues

**"The system cannot find the path specified"**
- This error occurs when running tests via npm scripts outside Claude Code
- Solution: Run tests from within Claude Code's terminal, or use the agent-browser commands directly

**"Browser not connected"**
- Run `agent-browser open <url>` to start a browser session first
- Check if another browser session is already running

**Chromium not installed**
- Run `agent-browser install` to download Chromium
- On Windows, you may need to run as administrator

**Elements not found / wrong refs**
- Element refs are dynamic and change when sections expand/collapse
- Take a fresh snapshot with `agent-browser snapshot -i` to get current refs

### Chrome Integration Issues

**Extension not detected**
- Verify extension version is 1.0.36 or higher
- Check Claude Code version: `claude --version`
- Run `/chrome` and select "Reconnect extension"
- Restart both Claude Code and Chrome

**Browser not responding**
- Check for modal dialogs blocking the page
- Create a new tab and try again
- Disable/re-enable the Chrome extension

**First-time setup**
- Native messaging host installs automatically
- May need to restart Chrome after first use

---

## Running Tests

**Important:** Tests require Claude Code's terminal environment.

### Quick Start

1. Start the dev server: `pnpm dev` (on port 3001)
2. Open browser: `agent-browser open http://localhost:3001/composer`
3. Run tests: `npx tsx src/test/browser/runner.ts`

### From Claude Code (Recommended)

```bash
# Verify browser is connected
agent-browser snapshot -i

# Run all tests
npx tsx src/test/browser/runner.ts

# Run specific category
npx tsx src/test/browser/runner.ts --category controls

# Run with verbose output
npx tsx src/test/browser/runner.ts --verbose

# Include TODO/placeholder tests
npx tsx src/test/browser/runner.ts --include-todo
```

### npm Scripts

```bash
pnpm test:browser           # All active tests
pnpm test:browser:controls  # Control tests (sliders, inputs)
pnpm test:browser:orbit     # Orbit control tests
pnpm test:browser:ui-state  # UI state tests
pnpm test:browser:api       # API flow tests (TODO)
pnpm test:browser:logging   # Logging tests (TODO)
pnpm test:browser:verbose   # Verbose output
```

---

## Screenshot Naming Convention

```
{test-name}-{phase}-{YYYY-MM-DD}-{HHMMSS}.png
```

**Examples:**
- `position-x-before-2024-01-25-103045.png`
- `lighting-preset-dropdown-open-2024-01-25-104523.png`

**Common phases:**
- `before` / `after` - Before/after test action
- `after-increase` / `after-decrease` - Slider adjustments
- `dropdown-open` - Dropdown menu state
- `error` / `success` - Test result states
- `initial` / `final` - Multi-step test bookends

---

## Test Reports

JSON reports are saved after each test run:
- `report-{timestamp}.json` - Full results with pass/fail status

---

## Cleanup

Old screenshots are auto-cleaned (keeps last 5 per test).

Manual cleanup:
```bash
# Delete screenshots older than 7 days
find public/test-screenshots -name "*.png" -mtime +7 -delete
```

---

## Directory Contents

Git-tracked:
- `README.md` - This documentation
- `.gitkeep` - Ensures directory exists
- `.gitignore` - Excludes screenshots from git

Local-only (not committed):
- `*.png` - Screenshot files
- `report-*.json` - Test reports
