# Browser Integration

Control a browser for UI testing, visual verification, and web automation using **Vercel Agent Browser**.

## Quick Start

```bash
# One-time global install
npm install -g agent-browser
agent-browser install  # Downloads Chromium

# Then use directly via bash - no MCP needed!
agent-browser open http://localhost:3000
agent-browser snapshot -i  # Get interactive elements
agent-browser click @e1    # Click element by ref
```

**Why Agent Browser?**
- 93% less context usage than MCP solutions
- Stable element refs (`@e1`, `@e2`) - no fragile CSS selectors
- Zero configuration - just npm install
- Built specifically for AI agents

---

## Installation

### Standard Install

```bash
npm install -g agent-browser
agent-browser install
```

### Linux (may need system deps)

```bash
npm install -g agent-browser
agent-browser install --with-deps
```

### Copy Skill to Project (Optional)

```bash
cp -r node_modules/agent-browser/skills/agent-browser .claude/skills/
```

---

## Core Commands

### Navigation

| Command | Description |
|---------|-------------|
| `agent-browser open <url>` | Open URL in browser |
| `agent-browser goto <url>` | Navigate to URL |
| `agent-browser back` | Go back |
| `agent-browser forward` | Go forward |
| `agent-browser reload` | Reload page |

### Inspection (The Killer Feature)

```bash
# Get snapshot with stable element references
agent-browser snapshot -i

# Output:
# button "Sign In" [ref=e1]
# input "Email" [ref=e2]
# input "Password" [ref=e3]
# link "Forgot password?" [ref=e4]
```

The `-i` flag shows only interactive elements. Refs like `@e1` are stable - use them directly!

### Interaction

| Command | Description |
|---------|-------------|
| `agent-browser click @e1` | Click element by ref |
| `agent-browser fill @e2 "text"` | Type into input |
| `agent-browser type "text"` | Type at cursor |
| `agent-browser check @e3` | Check checkbox |
| `agent-browser select @e4 "option"` | Select dropdown option |
| `agent-browser hover @e5` | Hover over element |
| `agent-browser drag @e1 @e2` | Drag and drop |

### Capture

| Command | Description |
|---------|-------------|
| `agent-browser screenshot file.png` | Capture screenshot |
| `agent-browser pdf file.pdf` | Save as PDF |
| `agent-browser text` | Get page text |
| `agent-browser html` | Get page HTML |

### Wait Conditions

```bash
agent-browser wait-for-element "button.submit"
agent-browser wait-for-text "Success"
agent-browser wait-for-url "**/dashboard"
agent-browser wait-for-load
```

---

## Sessions & Profiles

### Isolated Sessions

Run separate browser instances that don't share state:

```bash
# Session A - testing checkout
agent-browser --session checkout open http://localhost:3000

# Session B - testing admin (separate cookies, storage)
agent-browser --session admin open http://localhost:3000/admin
```

### Persistent Profiles

Keep login state across restarts:

```bash
# First time - logs in, saves cookies
agent-browser --profile myapp open http://localhost:3000
agent-browser --profile myapp fill @e1 "user@example.com"
agent-browser --profile myapp click @e2  # Sign in

# Later - still logged in!
agent-browser --profile myapp open http://localhost:3000/dashboard
```

---

## Use Cases

### Visual UI Testing

```
agent-browser open http://localhost:3000
agent-browser snapshot -i
agent-browser screenshot homepage.png

# Navigate through pages
agent-browser click @e5  # Products link
agent-browser wait-for-load
agent-browser screenshot products.png

# Check for console errors
agent-browser evaluate "window.console.errors || []"
```

### Form Testing

```
agent-browser open http://localhost:3000/signup
agent-browser snapshot -i

# Test empty submission
agent-browser click @e4  # Submit button
agent-browser screenshot validation-error.png

# Test valid submission
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "SecurePass123"
agent-browser fill @e3 "SecurePass123"
agent-browser click @e4
agent-browser wait-for-url "**/welcome"
agent-browser screenshot success.png
```

### E2E User Flow

```
# Checkout flow
agent-browser open http://localhost:3000/products
agent-browser click @e3  # Add to cart
agent-browser click @e7  # Go to cart
agent-browser click @e2  # Checkout
agent-browser fill @e1 "123 Main St"
agent-browser fill @e2 "4242424242424242"
agent-browser click @e5  # Place order
agent-browser wait-for-text "Order confirmed"
agent-browser screenshot confirmation.png
```

### Responsive Testing

```bash
# Mobile
agent-browser viewport 375 667
agent-browser screenshot mobile.png

# Tablet
agent-browser viewport 768 1024
agent-browser screenshot tablet.png

# Desktop
agent-browser viewport 1280 800
agent-browser screenshot desktop.png
```

### Device Emulation

```bash
agent-browser device "iPhone 14"
agent-browser screenshot iphone.png

agent-browser device "iPad Pro"
agent-browser screenshot ipad.png
```

---

## Ralph Wiggum Loop Integration

Agent Browser is perfect for autonomous verification:

```
Write feature
    ↓
Claude implements
    ↓
Deploy (Pulumi/Vercel/etc)
    ↓
agent-browser validates  ← The AI verifies its own work
    ↓
Loop until passing
```

Example verification step:
```bash
# Verify the feature works
agent-browser open http://localhost:3000
agent-browser snapshot -i
agent-browser click @e3  # New feature button
agent-browser wait-for-text "Feature loaded"
agent-browser screenshot verification.png
```

---

## Advanced Features

### Network Interception

```bash
# Mock API responses
agent-browser intercept "**/api/users" '{"users": []}'

# Block requests
agent-browser block "*.analytics.com"
```

### Cookie & Storage

```bash
# Get cookies
agent-browser cookies

# Set cookie
agent-browser set-cookie "session=abc123"

# Access localStorage
agent-browser evaluate "localStorage.getItem('token')"
```

### Multiple Tabs

```bash
agent-browser new-tab
agent-browser switch-tab 1
agent-browser close-tab
```

### Trace Recording (Debug)

```bash
agent-browser trace-start
# ... do stuff ...
agent-browser trace-stop trace.zip
```

---

## Comparison to Old Chrome DevTools MCP

| Aspect | Agent Browser | Chrome DevTools MCP |
|--------|---------------|---------------------|
| Setup | `npm install -g` | MCP config + Chrome flags |
| Element selection | Stable refs (`@e1`) | Fragile CSS/XPath |
| Context usage | 93% less | Heavy |
| Configuration | Zero | Significant |
| Reliability | High (refs are stable) | Medium (selectors break) |
| AI-native | Yes (built for agents) | No (adapted for agents) |

---

## Troubleshooting

### "Chromium not found"
```bash
agent-browser install
```

### "Element ref not found"
Refs are reset when page changes. Get a fresh snapshot:
```bash
agent-browser snapshot -i
```

### "Timeout waiting for element"
Increase wait time or check if element exists:
```bash
agent-browser wait-for-element "selector" --timeout 10000
```

### Linux display issues
```bash
agent-browser install --with-deps
```

---

## Arguments

$ARGUMENTS specifies:
- URL to test
- Specific test scenario
- What to verify

## Example Usage

```
/browser "Test signup flow at localhost:3000"
/browser "Screenshot all pages and check for console errors"
/browser "Verify the checkout process works end-to-end"
/browser "Test responsive layout at mobile, tablet, and desktop sizes"
```
