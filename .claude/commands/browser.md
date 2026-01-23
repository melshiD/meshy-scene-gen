# Browser Integration

Control a browser for UI testing, visual verification, and web automation.

## Quick Start

### Option 1: Chrome DevTools MCP (Recommended - Full Power)

```bash
# Add the MCP server (one-time setup)
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest

# Start Chrome with remote debugging
chrome --remote-debugging-port=9222

# Or on Mac:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Or on Windows:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# Then start Claude
claude
```

**Capabilities:**
- Full Chrome DevTools access
- DOM inspection and manipulation
- Performance profiling
- Network request analysis
- JavaScript debugging and console
- Screenshot capture
- Element selection and interaction
- CSS inspection and modification

### Option 2: Chrome Extension (Simpler, but limited)

```bash
claude --chrome
```

Requires installing "Claude in Chrome" extension. Simpler setup but less powerful and can timeout on long sessions.

---

## One-Time Setup

### Add to Your MCP Config

Add to `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

### Create a Browser Launch Script

**Windows (`start-chrome-debug.bat`):**
```batch
@echo off
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug"
```

**Mac/Linux (`start-chrome-debug.sh`):**
```bash
#!/bin/bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
# Or for Mac:
# /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

The `--user-data-dir` creates a separate profile so it doesn't interfere with your normal Chrome.

---

## Use Cases

### Visual UI Testing

```
Open my app at localhost:3000 and:
1. Navigate through all main pages
2. Take screenshots of each
3. Check for layout issues, broken images, console errors
4. Report any problems found
```

### Design Comparison

```
Compare my implementation at localhost:3000 against the design mockup at [URL].
Identify:
- Spacing differences
- Color mismatches
- Layout problems
- Missing elements
```

### Form Testing

```
Test the signup form at localhost:3000/signup:
1. Try submitting empty form (check validation)
2. Try invalid email format
3. Try password too short
4. Submit with valid data
5. Verify success state
```

### E2E User Flow

```
Test the complete checkout flow:
1. Add item to cart
2. Go to cart
3. Enter shipping info
4. Enter payment (use test card)
5. Complete purchase
6. Verify confirmation page
```

### Performance Analysis

```
Profile the performance of localhost:3000:
1. Run Lighthouse audit
2. Check for slow network requests
3. Identify render-blocking resources
4. Look for memory leaks
5. Report optimization recommendations
```

### Debug JavaScript Errors

```
My app at localhost:3000 has a bug when clicking the submit button.
1. Open DevTools console
2. Click the submit button
3. Capture any errors
4. Inspect the relevant code
5. Identify the root cause
```

---

## Integration with Verify Agent

Update your `verify-app` agent to include browser testing:

```markdown
## Browser Verification Steps

After code changes that affect UI:
1. Ensure Chrome is running with --remote-debugging-port=9222
2. Start dev server (npm run dev)
3. Navigate to localhost:3000
4. Run through affected user flows
5. Check for:
   - Console errors (JavaScript exceptions)
   - Network failures (failed API calls)
   - Broken layouts (missing elements, overflow)
   - Performance issues (slow loads)
6. Screenshot any issues found
7. Report findings with reproduction steps
```

---

## Workflow Integration

### Pre-Commit Browser Check

Add to your workflow:
```
Before committing frontend changes:
1. Start Chrome debug mode
2. Run /browser "Quick smoke test of changed pages"
3. Fix any issues
4. Then /commit-push-pr
```

### Parallel Agent for UI Testing

Dedicate one of your 5 agents to browser testing:
```
Agent 5 (UI Testing):
- Runs continuous browser verification
- Screenshots all pages after changes
- Compares against baseline images
- Reports visual regressions
```

---

## Security Notes

⚠️ **Development Only**

- Remote debugging port (9222) allows any local process to control Chrome
- Never enable on production machines
- Use a separate Chrome profile (`--user-data-dir`)
- Close the debugging port when done

---

## Troubleshooting

### "Cannot connect to Chrome"
→ Make sure Chrome is running with `--remote-debugging-port=9222`

### "Port already in use"
→ Close other Chrome instances or use a different port

### "Session timeout"
→ Break long E2E tests into smaller chunks

### "Element not found"
→ Add waits for dynamic content to load

---

## Arguments

$ARGUMENTS specifies:
- URL to test
- Specific test scenario
- What to look for

## Example Usage

```
/browser "Test signup flow at localhost:3000"
/browser "Screenshot all pages and check for console errors"
/browser "Profile performance of the dashboard page"
/browser "Debug the payment form - it's throwing errors"
```
