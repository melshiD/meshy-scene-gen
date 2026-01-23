---
name: feature-workflow
description: Structured feature development combining feature-dev plugin with local patterns
context: fork
model: opus
requires_plugin: feature-dev@claude-plugins-official
---

# Feature Workflow

Comprehensive feature development workflow that combines the official `feature-dev` plugin with this toolkit's patterns.

## Plugin Installation

```bash
/plugin marketplace add anthropics/claude-plugins-official
/plugin install feature-dev@claude-plugins-official
```

## When to Use

Use this workflow for:
- New features (not bug fixes)
- Changes touching 3+ files
- Unfamiliar parts of the codebase
- Features requiring architectural decisions

Skip for:
- Single-file bug fixes
- Simple refactors
- Documentation updates

## The 7-Phase Workflow

### Phase 1: Exploration

**Goal**: Understand the codebase before designing.

The plugin automatically:
- Scans directory structure
- Identifies relevant existing patterns
- Finds similar implementations
- Maps dependencies

**Output**: Exploration report with:
- Relevant files identified
- Existing patterns documented
- Dependencies mapped
- Integration points noted

### Phase 2: Clarification

**Goal**: Resolve ambiguity before designing.

The plugin asks clarifying questions about:
- Edge cases
- Error handling expectations
- Performance requirements
- Integration constraints

**You should answer**: All questions before proceeding.

### Phase 3: Architecture

**Goal**: Design before implementing.

Based on exploration + clarification, the plugin proposes:
- Component structure
- File organization
- API design
- Data flow

**Output**: Architecture document with:
- Proposed structure
- Rationale for decisions
- Trade-offs considered
- Alternative approaches rejected

### Phase 4: Quality Review

**Goal**: Validate design before coding.

The plugin self-reviews the architecture for:
- Consistency with existing patterns
- Potential issues
- Missing considerations
- Complexity concerns

**Gate**: Must pass review before Phase 5.

### Phase 5: Implementation

**Goal**: Write code following the plan.

Implementation follows:
- Architecture from Phase 3
- TDD if superpowers is installed
- Existing code patterns from Phase 1
- Answers from Phase 2

### Phase 6: Testing

**Goal**: Verify functionality.

- Unit tests for new code
- Integration tests for touchpoints
- Edge cases from Phase 2
- Regression check

### Phase 7: Documentation

**Goal**: Update relevant docs.

- Update CLAUDE.md if patterns changed
- API documentation if applicable
- README updates if user-facing

## Input

$ARGUMENTS should specify:
- Feature description (required)
- Constraints: `--no-breaking-changes`, `--backwards-compatible`
- Scope: `--scope=backend`, `--scope=frontend`, `--scope=full`
- Speed: `--quick` (skip some phases for smaller features)

## Examples

```
# Full feature workflow
"Add user authentication with OAuth2 support"

# Backend-only scope
"Add rate limiting to API endpoints --scope=backend"

# Quick mode for smaller features
"Add dark mode toggle --quick"

# With constraints
"Refactor the payment module --no-breaking-changes"
```

## Integration with Toolkit

### With /plan command

The `/plan` command provides lightweight planning. Use feature-workflow when you need:
- Deeper codebase exploration
- Formal architecture documentation
- Quality gates before implementation

```
# Simple task → /plan
/plan "Add a logout button"

# Complex feature → feature-workflow
"Add complete authentication system with OAuth2, MFA, and session management"
```

### With superpowers plugin

If both plugins are installed:
- feature-dev handles Phases 1-4 (exploration → quality review)
- superpowers handles Phase 5 (TDD implementation)
- Both contribute to Phases 6-7

```
# Combined workflow
"Build payment integration. Use feature-dev for design, superpowers for TDD implementation."
```

### With parallel agents

For large features, split across agents after Phase 4:

```
Agent 1 (main): Run Phases 1-4
                Share architecture document

Agent 2-5: Each implements part of the architecture
           Using superpowers TDD

Agent 1: Coordinates merge and Phase 6-7
```

## Output

After completion:

```markdown
## Feature Development Report

**Feature**: [Name]
**Phases Completed**: 7/7

### Exploration Summary
- Files analyzed: 47
- Relevant patterns: 3
- Integration points: 2

### Architecture Decisions
1. [Decision 1] - [Rationale]
2. [Decision 2] - [Rationale]

### Implementation Summary
- Files created: 4
- Files modified: 6
- Tests added: 12

### Quality Metrics
- Test coverage: 94%
- No breaking changes: ✓
- Follows existing patterns: ✓

### Documentation Updated
- CLAUDE.md: ✓
- API docs: ✓
```

## Customization

Create `.claude/feature-workflow.local.md` to customize:

```markdown
# Feature Workflow Config

## Phase Adjustments
- Always include performance analysis in exploration
- Require security review for auth-related features
- Skip Phase 7 (docs) for internal tools

## Architecture Templates
- Use hexagonal architecture for new services
- Prefer composition over inheritance
- Always include error boundaries in React components

## Testing Requirements
- Minimum 80% coverage
- Required: unit, integration
- Optional: e2e (only for user flows)
```
