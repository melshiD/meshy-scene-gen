---
name: superpowers-config
description: Configure superpowers plugin phases for your workflow
context: fork
model: haiku
requires_plugin: superpowers@superpowers-marketplace
---

# Superpowers Configuration

Guide for configuring the superpowers plugin to match your team's workflow preferences.

## Plugin Installation

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## Phase Configuration

Superpowers runs 7 phases. Configure which phases to emphasize based on your needs.

### Phase Overview

| Phase | Purpose | When to Emphasize |
|-------|---------|-------------------|
| 1. Brainstorming | Refine ideas through questions | Complex/ambiguous requirements |
| 2. Git Worktrees | Create isolated branches | Parallel agent work |
| 3. Plan Writing | Decompose into small tasks | Large features |
| 4. Execution | Subagent dispatch + review | Multi-file changes |
| 5. TDD | RED-GREEN-REFACTOR | All implementation |
| 6. Code Review | Evaluate against spec | Before merge |
| 7. Branch Completion | Clean merge/PR | Feature complete |

## Workflow Presets

### $ARGUMENTS Options

- `full` - All 7 phases (default for complex features)
- `quick` - Skip brainstorming, minimal planning (small fixes)
- `tdd-only` - Focus on TDD phase (adding to existing feature)
- `review-only` - Just code review (pre-merge check)

### Preset Details

**Full Workflow** (`full` or no argument):
```
"Build user authentication with superpowers"
```
- Brainstorming: 5-10 questions to clarify requirements
- Planning: Tasks decomposed to 2-5 minute chunks
- TDD: Strict RED-GREEN-REFACTOR for each task
- Review: Two-stage (spec compliance + code quality)

**Quick Workflow** (`quick`):
```
"Fix the login button bug, quick workflow"
```
- Skip brainstorming (requirements clear)
- Minimal planning (single task)
- TDD still enforced
- Light review

**TDD Only** (`tdd-only`):
```
"Add password reset feature, tdd-only"
```
- Assume planning done
- Focus on RED-GREEN-REFACTOR cycles
- Each test must fail first
- Commit after each green

**Review Only** (`review-only`):
```
"Review my changes before merge, review-only"
```
- Skip implementation phases
- Evaluate against any existing spec
- Categorize issues by severity
- Block on critical issues

## TDD Enforcement

The TDD phase enforces strict RED-GREEN-REFACTOR:

1. **RED**: Write a failing test
2. **Watch it fail**: Confirm the test actually fails
3. **GREEN**: Write minimal code to pass
4. **Watch it pass**: Confirm the test passes
5. **REFACTOR**: Clean up while green
6. **Commit**: Lock in the progress

**Anti-patterns the plugin prevents**:
- Writing implementation before tests
- Skipping the "watch it fail" step
- Large batches of tests at once
- Refactoring while red

## Subagent Execution

During the Execution phase, superpowers dispatches subagents:

```
┌─────────────────────────────────────────────┐
│  Main Agent (Orchestrator)                  │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │Subagent1│  │Subagent2│  │Subagent3│     │
│  │ Task A  │  │ Task B  │  │ Task C  │     │
│  └────┬────┘  └────┬────┘  └────┬────┘     │
│       │            │            │          │
│       ▼            ▼            ▼          │
│  ┌─────────────────────────────────────┐   │
│  │  Two-Stage Review                   │   │
│  │  1. Spec compliance                 │   │
│  │  2. Code quality                    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

Each subagent gets:
- Fresh context (no pollution from other tasks)
- Complete task specification
- Access to codebase
- Review before merge

## Integration with Toolkit

| Toolkit Command | Superpowers Enhancement |
|-----------------|------------------------|
| `/plan` | Use superpowers brainstorming + plan writing |
| `/test-fix` | Use superpowers TDD phase |
| `/ralph-wiggum` | Full superpowers loop with autonomous execution |
| `/commit-push-pr` | Use after superpowers branch completion |

## Example Usage

```
# Full feature with superpowers
"I need to add Stripe payment integration. Use superpowers full workflow."

# Quick bug fix
"Fix the null pointer in getUserById, quick workflow"

# Pre-merge review
"Review the changes on this branch, review-only"

# TDD a new function
"Add a calculateDiscount function, tdd-only"
```

## Customization

To modify default phase behavior, the plugin looks for `.claude/superpowers.local.md` for project-specific overrides.

Example override file:
```markdown
# Superpowers Project Config

## Phase Adjustments
- Skip brainstorming for bug fixes under 50 lines
- Always require TDD (no exceptions)
- Code review threshold: 90 (stricter than default 80)

## Test Framework
- Use Vitest for JavaScript
- pytest for Python
- Require minimum 80% coverage for new code
```
