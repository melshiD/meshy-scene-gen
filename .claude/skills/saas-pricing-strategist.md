---
name: saas-pricing-strategist
description: Research industry pricing models and design pricing strategy
context: fork
model: opus
tools:
  - WebSearch
  - Read
---

# SaaS Pricing Strategist

Research industry pricing models, analyze competitors, and design pricing strategies for your product.

## When to Use

- Launching a new product and need pricing strategy
- Revisiting pricing for an existing product
- Competitive analysis for pricing positioning
- Validating current pricing against market

## Input

$ARGUMENTS should describe:
- **Product type**: What you're building
- **Target market**: Who you're selling to
- **Key differentiators**: What makes you unique
- **Constraints** (optional): Price anchors, margin requirements

**Commands**:
- `analyze [product description]` - Full pricing strategy
- `research [competitor/industry]` - Specific research
- `refresh-knowledge` - Update knowledge base with latest data

**Example inputs**:
```
"analyze: AI-powered web scraper for marketers,
 targeting SMBs, differentiator is no-code setup"

"research: How do Apify, Scrapy Cloud, and Bright Data price?"

"analyze: Document summarization API for developers,
 must maintain 60%+ margins"
```

## Process

### 1. Load Knowledge Base

Read `scaffold/knowledge/saas-pricing-models.md` for:
- Pricing model taxonomy
- Industry benchmarks
- Failed models to avoid

### 2. Conduct Research (if needed)

For `research` or when knowledge base is insufficient:
- Search for competitor pricing pages
- Look for industry reports
- Find pricing case studies

### 3. Analyze Product Fit

Match product characteristics to pricing models:

| Characteristic | Favors Model |
|----------------|--------------|
| High usage variance | Usage-based or credits |
| Team collaboration | Per-seat component |
| Clear feature tiers | Good/Better/Best |
| API-heavy | Usage-based |
| Enterprise focus | Custom pricing tier |

### 4. Competitive Positioning

```
Price/Value Matrix:

        High Price
             │
    Premium  │  Overpriced
             │
   ──────────┼──────────
             │
   Underpriced │  Budget
             │
        Low Price

     Low Value ← → High Value
```

### 5. Design Pricing Structure

Create specific tiers with:
- Price points
- Feature allocation
- Usage limits
- Target customer profile

### 6. Validate Against Constraints

Check:
- Margin requirements met
- Competitive positioning achieved
- Customer segments addressed

## Output

```markdown
## Pricing Strategy: [Product Name]

### Executive Summary

**Recommended model**: [Primary model]
**Price range**: $[X] - $[Y]/month
**Key insight**: [One-line strategic insight]

### Market Research

**Competitor Analysis**:
| Competitor | Model | Entry Price | Notes |
|------------|-------|-------------|-------|
| [Name] | [Model] | $[X] | [Notes] |

**Industry Patterns**:
- [Pattern 1]
- [Pattern 2]

**What's Working**:
- [Successful approach 1]

**What's Failed**:
- [Failed approach to avoid]

### Recommended Pricing Structure

#### Tier 1: [Name] - $[X]/mo
**Target**: [Customer profile]
**Includes**:
- [Feature 1]
- [Feature 2]
- [Limit 1]

**Why this price**: [Rationale]

#### Tier 2: [Name] - $[X]/mo
**Target**: [Customer profile]
**Includes**:
- Everything in Tier 1
- [Additional feature 1]
- [Higher limit 1]

**Why this price**: [Rationale]

#### Tier 3: [Name] - Custom
**Target**: [Customer profile]
**Includes**:
- Everything in Tier 2
- [Enterprise features]
- Custom limits

**Why custom**: [Rationale]

### Pricing Psychology

**Anchoring**: [How tiers anchor each other]
**Decoy**: [If applicable, which tier drives upgrades]
**Value framing**: [How to present the value]

### Implementation Checklist

- [ ] Pricing page copy
- [ ] Feature comparison table
- [ ] Usage metering setup
- [ ] Billing system configuration
- [ ] Upgrade/downgrade flows
- [ ] Overage handling
- [ ] Annual discount (typically 15-20%)

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| [Risk 1] | [Mitigation] |
| [Risk 2] | [Mitigation] |

### Metrics to Track

Post-launch, monitor:
- Conversion rate by tier
- Upgrade rate (Tier 1 → 2)
- Churn rate by tier
- Revenue per customer
- Margin per tier
```

## Example Analysis

**Input**: "analyze: AI web scraper for marketers, SMB target, no-code differentiator"

**Output**:
```markdown
## Pricing Strategy: AI Web Scraper

### Executive Summary

**Recommended model**: Tiered + Usage (credit-based)
**Price range**: $0 - $199/month (with credit packs)
**Key insight**: No-code positioning justifies premium over dev tools;
credits smooth token cost variance.

### Market Research

**Competitor Analysis**:
| Competitor | Model | Entry Price | Notes |
|------------|-------|-------------|-------|
| Apify | Usage (compute) | $49/mo | Developer-focused |
| Browse AI | Tiered + credits | $39/mo | No-code, our direct comp |
| Bright Data | Usage + platform | $500+/mo | Enterprise proxy focus |
| Octoparse | Tiered | $89/mo | Desktop + cloud hybrid |

**Industry Patterns**:
- No-code tools price 1.5-2x dev tools (convenience premium)
- Credit systems dominate for variable-cost AI features
- Free tiers are table stakes for SMB acquisition

**What's Working**:
- Browse AI's credit model with rollover
- Apify's transparent compute pricing for developers

**What's Failed**:
- Pure per-page pricing (customer anxiety)
- Unlimited plans (margin death)

### Recommended Pricing Structure

#### Free Tier - $0/mo
**Target**: Tire-kickers, tiny use cases
**Includes**:
- 50 credits/month (no rollover)
- 3 saved scrapers
- JSON export only
- Community support

**Why this price**: Acquisition funnel, proves value

#### Starter - $39/mo
**Target**: Solo marketers, small projects
**Includes**:
- 500 credits/month (30-day rollover)
- 10 saved scrapers
- JSON + CSV + Google Sheets
- Email support
- Scheduled runs (daily)

**Why this price**: Below Browse AI ($48), establishes value

#### Pro - $99/mo
**Target**: Marketing teams, agencies
**Includes**:
- 2,000 credits/month (60-day rollover)
- Unlimited saved scrapers
- All export formats + webhooks
- Priority support
- Scheduled runs (hourly)
- Team seats (up to 5)

**Why this price**: Sweet spot for serious users, healthy margin

#### Business - $199/mo
**Target**: Agencies, power users
**Includes**:
- 5,000 credits/month (90-day rollover)
- Everything in Pro
- API access
- Custom extraction rules
- Dedicated success manager
- Team seats (up to 15)

**Why this price**: Bridges gap to enterprise, captures agencies

#### Enterprise - Custom
**Target**: Large organizations
**Includes**:
- Custom credit volume
- SLA
- SSO/SAML
- Custom integrations
- Dedicated infrastructure

**Why custom**: Deal size justifies sales involvement

### Credit Pack Add-ons

For users who need more credits without upgrading:
| Pack | Credits | Price | Per-Credit |
|------|---------|-------|------------|
| Small | 250 | $20 | $0.08 |
| Medium | 750 | $50 | $0.067 |
| Large | 2000 | $120 | $0.06 |

### Pricing Psychology

**Anchoring**: Pro at $99 makes Starter feel like a bargain
**Decoy**: Starter→Pro jump ($60) delivers 4x credits
**Value framing**: "One credit = one page, any complexity"

### Metrics to Track

- Free→Paid conversion (target: 5-8%)
- Starter→Pro upgrade (target: 20% within 6mo)
- Credit utilization by tier
- Overage purchases (healthy if 10-15% of revenue)
```

## Refresh Knowledge Command

When you run `refresh-knowledge`:

1. Search for latest AI SaaS pricing trends
2. Update competitor pricing data
3. Check for new pricing models
4. Update token cost references
5. Write updates to `scaffold/knowledge/saas-pricing-models.md`

## Integration

Works with:
- `token-economics` - cost basis for pricing decisions
- `entitlements-designer` - what goes in each tier
- `cost-observability` - track actual vs. projected margins
