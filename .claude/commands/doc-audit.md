# Documentation Audit

Comprehensive documentation review and validation.

## Audit Levels

- **quick** - README + API docs only
- **standard** - All user-facing documentation
- **deep** - Full codebase + all docs
- **tech-manual** - Technical specifications and architecture

## Process

### 1. Discovery
- List all documentation files (*.md, docs/*, comments)
- Identify documentation types
- Note last modified dates

### 2. Accuracy Check
- Verify code examples compile/run
- Check described features exist
- Verify API endpoints match implementation
- Test installation instructions

### 3. Completeness Check
- All public APIs documented?
- All config options explained?
- Error handling documented?
- Migration guides present?

### 4. Quality Check
- Consistent formatting?
- Clear language?
- Good examples?
- Proper organization?

## Output Format

```
## Documentation Audit Report

**Date**: [date]
**Scope**: [quick/standard/deep/tech-manual]

### Summary
- Files Audited: X
- Issues Found: Y
- Critical Issues: Z

### Critical (Must Fix)
1. [File] - [Issue] - [Suggested Fix]

### High Priority
1. [File] - [Issue] - [Suggested Fix]

### Medium Priority
1. [File] - [Issue] - [Suggested Fix]

### Recommendations
1. [Action item]

### Files Reviewed
- [x] README.md - OK
- [ ] docs/api.md - Needs update
```

## Arguments

$ARGUMENTS specifies audit level or specific focus:
- Level: "quick", "standard", "deep", "tech-manual"
- Path: "docs/api"
- Focus: "code examples only"

## Example Usage

```
/doc-audit quick
/doc-audit standard
/doc-audit "tech-manual"
/doc-audit "README only"
```
