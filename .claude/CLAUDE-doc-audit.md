# Documentation Audit System - Claude Agent Configuration

> Systematic documentation review, validation, and maintenance patterns
> Use with /doc-audit command for comprehensive documentation analysis

---

## Documentation Audit Framework

### Audit Levels

| Level | Scope | Use Case |
|-------|-------|----------|
| **Quick** | README + API docs | Pre-release sanity check |
| **Standard** | All user-facing docs | Sprint end review |
| **Deep** | Full codebase + docs | Quarterly audit |
| **Tech Manual** | Technical specifications | Architecture reviews |

---

## Quick Audit Checklist

### README.md

- [ ] Project description is accurate
- [ ] Installation instructions work
- [ ] Quick start example runs
- [ ] Links are not broken
- [ ] Version/badge info is current
- [ ] License information present

### API Documentation

- [ ] All endpoints documented
- [ ] Request/response examples accurate
- [ ] Error codes listed
- [ ] Authentication explained
- [ ] Rate limits documented

---

## Standard Audit Process

### Phase 1: Discovery

```
1. List all documentation files
2. Identify documentation types:
   - User guides
   - API references
   - Architecture docs
   - Tutorials
   - Changelog
3. Note last modified dates
4. Identify potential gaps
```

### Phase 2: Accuracy Check

```
For each documentation file:
1. Verify code examples compile/run
2. Check that described features exist
3. Verify API endpoints match implementation
4. Confirm configuration options are valid
5. Test installation/setup instructions
```

### Phase 3: Completeness Check

```
1. All public APIs documented?
2. All configuration options explained?
3. Error messages and troubleshooting?
4. Migration guides for breaking changes?
5. Architecture decision records?
```

### Phase 4: Quality Check

```
1. Consistent formatting and style?
2. Clear and concise language?
3. Appropriate for target audience?
4. Good examples provided?
5. Proper navigation/organization?
```

---

## Deep Audit Process

### Code-to-Doc Sync

```bash
# Generate list of public exports
# Compare against documented items
# Flag undocumented or removed items
```

### Documentation Sources

| Source | Check For |
|--------|-----------|
| README.md | Overview accuracy |
| /docs folder | Completeness |
| JSDoc/docstrings | Code accuracy |
| OpenAPI/Swagger | API accuracy |
| CHANGELOG.md | Version accuracy |
| Comments | Outdated info |

### Audit Report Template

```markdown
# Documentation Audit Report

**Date**: YYYY-MM-DD
**Auditor**: Claude
**Scope**: [Quick/Standard/Deep]

## Summary
- Files Audited: X
- Issues Found: Y
- Critical Issues: Z

## Findings

### Critical (Must Fix)
1. [Issue description + location + fix]

### High (Should Fix)
1. [Issue description + location + fix]

### Medium (Consider Fixing)
1. [Issue description + location + fix]

### Low (Nice to Have)
1. [Issue description + location + fix]

## Recommendations
1. [Action item]
2. [Action item]

## Files Reviewed
- [ ] file1.md - Status
- [ ] file2.md - Status
```

---

## Tech Manual Audit

### Technical Specification Review

```
For architecture/technical documents:
1. Diagrams match implementation?
2. Data flow accurate?
3. Dependencies listed correctly?
4. Security considerations addressed?
5. Performance characteristics documented?
6. Scalability approach described?
```

### Architecture Decision Records (ADRs)

```
Verify each ADR contains:
- Title and date
- Status (proposed/accepted/deprecated)
- Context (why decision needed)
- Decision (what was decided)
- Consequences (tradeoffs accepted)
```

### Tech Manual Checklist

- [ ] System overview accurate
- [ ] Component diagrams current
- [ ] API contracts match code
- [ ] Database schema documented
- [ ] Environment requirements listed
- [ ] Deployment process documented
- [ ] Monitoring/logging explained
- [ ] Disaster recovery documented

---

## Documentation Standards

### Writing Style

```
1. Use active voice
2. Be concise - no filler words
3. Use present tense
4. Define acronyms on first use
5. Include examples for complex concepts
6. Use consistent terminology
```

### Code Examples

```
1. Must be runnable/compilable
2. Include imports/setup if needed
3. Show expected output
4. Cover common use cases
5. Note any prerequisites
```

### Formatting Standards

```
1. Use consistent heading hierarchy
2. Code blocks with language tags
3. Tables for structured data
4. Bullet lists for unordered items
5. Numbered lists for sequences
```

---

## Automated Checks

### Link Validation

```bash
# Check for broken links
npx markdown-link-check docs/**/*.md
```

### Code Example Validation

```bash
# Extract and test code blocks
npx ts-node scripts/test-docs.ts
```

### Spelling/Grammar

```bash
# Check for typos
npx cspell docs/**/*.md
```

### API Spec Validation

```bash
# Validate OpenAPI spec
npx @redocly/cli lint openapi.yaml
```

---

## Maintenance Schedule

### Per Commit

- Update docs for changed features
- Verify affected examples still work

### Weekly

- Quick audit of changed docs
- Update changelog

### Monthly

- Standard audit
- Review and close doc issues

### Quarterly

- Deep audit
- Architecture doc review
- Tech manual update

---

## Integration with Workflow

### Pre-PR Checklist

```
Before opening PR:
1. Updated relevant documentation?
2. Code examples still work?
3. CHANGELOG updated?
4. Breaking changes documented?
```

### Post-Release Checklist

```
After release:
1. Version numbers updated?
2. Migration guide written?
3. API docs published?
4. Release notes posted?
```

---

## Audit Command Templates

### Quick Audit Command

```
/doc-audit quick

Perform a quick documentation audit:
1. Check README.md for accuracy
2. Verify installation instructions
3. Test quick start example
4. Check for broken links
5. Report findings
```

### Full Audit Command

```
/doc-audit full

Perform comprehensive documentation audit:
1. Inventory all documentation
2. Check code-to-doc sync
3. Verify all examples
4. Check completeness
5. Generate audit report
```

### Tech Manual Audit Command

```
/doc-audit tech-manual

Audit technical documentation:
1. Review architecture docs
2. Validate ADRs
3. Check diagrams vs implementation
4. Verify API specifications
5. Generate tech manual report
```

---

*Use /doc-audit command to run documentation audits*
