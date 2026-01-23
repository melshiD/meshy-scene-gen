---
name: frontend-design
description: Build UIs with the official Anthropic frontend-design plugin, with customizable style direction
context: fork
model: opus
requires_plugin: frontend-design@claude-plugins-official
---

# Frontend Design

Build production-grade frontend interfaces using Anthropic's official `frontend-design` plugin, with the ability to override default style preferences.

## Plugin Setup

This skill requires the official Anthropic frontend-design plugin:

```bash
# Add the official marketplace (one-time)
/plugin marketplace add anthropics/claude-code

# Install the plugin
/plugin install frontend-design@claude-plugins-official
```

## Input

$ARGUMENTS can specify style direction to override the plugin's default bold aesthetics:

**Style Overrides:**
- `corporate` - Clean, professional, trustworthy (no experimental layouts)
- `minimal` - Restrained, whitespace-focused, subtle details only
- `playful` - Friendly, colorful, approachable
- `match:existing` - Match the project's existing design system
- `brand:[description]` - Follow specific brand guidelines
- `framework:[name]` - Target specific UI framework (shadcn, MUI, Chakra, etc.)

**Examples:**
```
/frontend-design corporate - Build a professional dashboard
/frontend-design minimal - Clean landing page, lots of whitespace
/frontend-design match:existing - Follow our current design patterns
/frontend-design brand:fintech serious trustworthy - Banking app feel
/frontend-design framework:shadcn - Use shadcn/ui components
```

## Style Direction Guide

The official plugin defaults to bold, distinctive aesthetics. Use these overrides when you need something different:

| When the user wants... | Use this style | Plugin behavior adjustment |
|------------------------|----------------|---------------------------|
| Enterprise/B2B software | `corporate` | Suppress experimental layouts, use conventional patterns |
| SaaS dashboard | `minimal` or `corporate` | Focus on clarity over creativity |
| Consumer app | (default or `playful`) | Let the plugin's creativity shine |
| Match existing codebase | `match:existing` | Analyze existing components first, match patterns |
| Specific brand | `brand:[details]` | Apply brand constraints before designing |

## Process

1. **Check Plugin Installed**
   - Verify `frontend-design@claude-plugins-official` is available
   - If not, prompt user to install

2. **Parse Style Arguments**
   - Extract style direction from $ARGUMENTS
   - If none specified, use plugin defaults (bold/distinctive)

3. **Apply Style Constraints**

   For `corporate`:
   - Use conventional grid layouts
   - Stick to professional fonts (but not generic - still quality choices)
   - Muted, trustworthy color palettes
   - Minimal animation (functional only)
   - Standard component patterns

   For `minimal`:
   - Maximum whitespace
   - Single accent color
   - Typography-focused
   - Subtle micro-interactions only
   - Grid-aligned, no overlap

   For `match:existing`:
   - First scan: `src/components/`, `src/styles/`, `tailwind.config.*`
   - Extract: color tokens, font choices, spacing scale, component patterns
   - Apply these as hard constraints

   For `brand:[description]`:
   - Parse brand keywords
   - Apply as design constraints
   - Document choices that support the brand

4. **Invoke Plugin**
   - Pass requirements + style constraints to frontend-design skill
   - Let plugin generate implementation

5. **Validate Output**
   - Check adherence to style constraints
   - Ensure production-ready code
   - Verify accessibility basics (contrast, focus states)

## Output

The plugin generates complete, working frontend code. This wrapper adds:

```markdown
## Style Application Report

**Requested Style**: corporate
**Constraints Applied**:
- Layout: Conventional 12-column grid
- Typography: [Selected fonts with rationale]
- Colors: [Palette with usage]
- Motion: Functional transitions only

**Design Decisions**:
- [Why specific choices were made]
- [How they support the style direction]

## Generated Code

[Plugin output here]

## Integration Notes

- Components location: `src/components/[feature]/`
- Required dependencies: [list]
- CSS/Tailwind additions: [if any]
```

## When NOT to Use Style Overrides

Let the plugin use its defaults when:
- Building a marketing/landing page meant to impress
- Creating a portfolio or showcase piece
- The user explicitly wants something distinctive/creative
- No existing design system to match

The plugin's bold aesthetic defaults are a feature, not a bug - they prevent generic "AI slop" output. Only constrain when the project genuinely needs it.
