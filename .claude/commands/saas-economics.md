# SaaS Economics Analysis

Run a comprehensive analysis of a feature's token economics, pricing strategy, entitlements, and observability setup.

## Usage

```
/saas-economics [feature description or "full" for complete product]
```

## What This Command Does

Orchestrates four specialized skills to give you a complete picture:

```
┌─────────────────────────────────────────────────────────────┐
│                    /saas-economics                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. token-economics                                         │
│     └─► Cost breakdown, variance analysis, optimization     │
│                                                             │
│  2. entitlements-designer                                   │
│     └─► What to expose, tier structure, quote triggers      │
│                                                             │
│  3. saas-pricing-strategist                                 │
│     └─► Market research, pricing structure, psychology      │
│                                                             │
│  4. cost-observability                                      │
│     └─► Metrics schema, dashboards, alerts                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Arguments

$ARGUMENTS can be:

**Feature description**:
```
/saas-economics AI scraper: parses HTML to extract events,
uses GPT-4o, averages 12K tokens, outputs 2-50 events per page.
Config options: URL patterns, extraction templates, output format,
custom rules, webhooks, model selection, concurrency.
```

**Analysis mode** (have existing data):
```
/saas-economics analyze: review scraper feature,
code at src/features/scraper/,
usage data at /data/metrics.csv
```

**Full product** (multiple features):
```
/saas-economics full: Our product has 3 AI features:
1. Scraper - extracts events from web pages
2. Summarizer - summarizes long documents
3. Chatbot - answers questions about scraped data

Target market: marketing agencies
```

## Process

### Phase 1: Discovery (5 min)

I'll ask clarifying questions about:
- Technical details (models, token patterns)
- Target customers (sophistication, budget)
- Business constraints (margin targets, competitors)
- Existing setup (code, data, observability)

### Phase 2: Token Economics (10 min)

Using `token-economics` skill:
- Calculate cost per operation
- Analyze value-to-cost ratio
- Identify variance and risk
- Find optimization opportunities

### Phase 3: Entitlements Design (10 min)

Using `entitlements-designer` skill:
- Inventory all configurable options
- Score and assign exposure levels
- Design tier structure
- Define quote-required boundaries

### Phase 4: Pricing Strategy (15 min)

Using `saas-pricing-strategist` skill:
- Research competitors and industry
- Design pricing tiers
- Set price points
- Plan psychology and positioning

### Phase 5: Observability Setup (10 min)

Using `cost-observability` skill:
- Design metrics schema
- Specify dashboards
- Configure alerts
- Generate implementation code

### Phase 6: Synthesis (5 min)

Combine everything into actionable plan:
- Implementation checklist
- Priority order
- Dependencies
- Risk mitigation

## Output

You'll receive a comprehensive document covering:

```markdown
# SaaS Economics: [Feature/Product]

## Executive Summary
- Recommended pricing model
- Key metrics to track
- Top 3 action items

## Token Economics
[Full token-economics output]

## Entitlements Design
[Full entitlements-designer output]

## Pricing Strategy
[Full saas-pricing-strategist output]

## Observability Setup
[Full cost-observability output]

## Implementation Plan

### Week 1: Foundation
- [ ] Set up metrics database
- [ ] Add basic instrumentation
- [ ] Deploy customer usage dashboard

### Week 2: Pricing
- [ ] Implement tier enforcement
- [ ] Build pricing page
- [ ] Set up billing integration

### Week 3: Optimization
- [ ] Implement token optimizations
- [ ] Configure alerts
- [ ] Launch to beta customers

## Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk] | [H/M/L] | [H/M/L] | [Action] |

## Decision Log
Document key decisions and rationale for future reference.
```

## Examples

### New Feature

```
/saas-economics AI document summarizer for legal teams:
- Input: Legal documents (contracts, briefs) up to 100 pages
- Output: Structured summary with key clauses highlighted
- Using Claude Sonnet for quality
- Target: Law firms and legal departments
- Config: Summary length, focus areas, output format, confidentiality mode
```

### Existing Feature (Audit)

```
/saas-economics analyze: Our scraper has been running 3 months.
Code: src/features/scraper/
Data: We use Postgres, table is operation_metrics
Current pricing: $0.10/scrape flat rate
Problem: Some customers are negative margin
```

### Full Product

```
/saas-economics full: Building an AI research assistant.
Features:
1. Web search + summarization
2. Document Q&A
3. Research report generation

Stack: Next.js, Vercel, Supabase
Target: Researchers and analysts at consulting firms
Constraint: Must maintain 60% gross margin
```

## Tips

1. **Provide specifics**: The more detail about token usage and output value, the better the analysis.

2. **Include constraints**: Margin requirements, price anchors, and competitor context help.

3. **Share existing data**: If you have usage metrics, include them for analyze mode.

4. **Iterate**: Run for individual features first, then full product.

## Related Commands

- `/plan` - For general feature planning
- `/feature-dev` - For implementation workflow
- `/commit-push-pr` - After implementing recommendations
