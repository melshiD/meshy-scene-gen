---
name: entitlements-designer
description: Design customer configuration boundaries and entitlement tiers
context: fork
model: opus
default_stance: conservative
---

# Entitlements Designer

Design what configuration options to expose to customers vs. keep internal, and structure entitlement tiers.

**Default stance**: Conservative (expose less, simpler UX, less support burden)

## When to Use

- Designing a new feature's customer interface
- Deciding what belongs in each pricing tier
- Determining what requires custom quotes
- Reducing support burden from configuration complexity

## Input

$ARGUMENTS should describe:
- **Feature/Product**: What you're designing entitlements for
- **Capabilities**: Full list of configurable options
- **Target customers**: Technical sophistication level
- **Constraints** (optional): Any must-haves or must-nots

**Example inputs**:
```
"AI Scraper with: URL targeting, extraction rules, output format,
 model selection, concurrency, retry logic, custom prompts, webhooks"

"Document processor with: file types, max size, output formats,
 summary length, language, custom instructions, API access"
```

## Process

### 1. Load Knowledge Base

Read `scaffold/knowledge/saas-pricing-models.md` for:
- Exposure ladder framework
- Quote-required triggers
- Industry patterns

### 2. Inventory All Capabilities

List every configurable aspect:
```
Capability Inventory:
├── Core functionality (what it does)
├── Input configuration (what goes in)
├── Processing options (how it works)
├── Output configuration (what comes out)
├── Performance tuning (speed/quality tradeoffs)
├── Integration options (webhooks, APIs)
└── Advanced/dangerous (could break things)
```

### 3. Score Each Capability

For each capability, score:

| Dimension | 1 (Low) | 5 (High) |
|-----------|---------|----------|
| **User need** | Rarely needed | Essential |
| **Complexity** | Simple to explain | Requires expertise |
| **Support risk** | Self-explanatory | Generates tickets |
| **Security risk** | Safe | Could be abused |
| **Cost impact** | Negligible | Major cost driver |

### 4. Apply Exposure Ladder

Based on scores, assign to exposure level:

| Level | Criteria | Typical Tier |
|-------|----------|--------------|
| 0 - Hidden | High risk, low need | Internal only |
| 1 - Presets | High need, would confuse if raw | All tiers (curated) |
| 2 - Basic | Common need, low risk | Starter+ |
| 3 - Advanced | Power user need, medium risk | Pro+ |
| 4 - Full | Technical users only, high risk | Enterprise/API |
| 5 - Custom | Requires review/contract | Quote required |

### 5. Conservative Filter (Default)

Apply conservative stance:
- When in doubt, hide it
- Prefer presets over raw configuration
- Group related options to reduce cognitive load
- Add friction to dangerous options

### 6. Design Quote Triggers

Identify what requires human review:
- Custom development
- Unusual scale
- Security/compliance needs
- SLA requirements

## Output

```markdown
## Entitlements Design: [Feature Name]

### Capability Exposure Matrix

| Capability | Level | Tier | Rationale |
|------------|-------|------|-----------|
| [Cap 1] | [0-5] | [Tier] | [Why] |
| [Cap 2] | [0-5] | [Tier] | [Why] |
| ... | ... | ... | ... |

### Tier Summary

**Free/Starter**:
- [List of exposed capabilities]
- Limits: [specific limits]

**Pro**:
- Everything in Starter, plus:
- [Additional capabilities]
- Limits: [specific limits]

**Enterprise**:
- Everything in Pro, plus:
- [Additional capabilities]
- Limits: [negotiable]

### Hidden (Internal Only)

These capabilities exist but are not exposed:
| Capability | Reason Hidden |
|------------|---------------|
| [Cap] | [Rationale] |

### Quote Required

These require sales conversation:
| Request Type | Why Quote Required |
|--------------|-------------------|
| [Type] | [Rationale] |

### UI Recommendations

**Preset Strategy**:
```
Instead of exposing:
  - Model: [dropdown with 5 options]
  - Temperature: [slider 0-1]
  - Max tokens: [input field]

Expose as presets:
  - Quality: [Fast / Balanced / Thorough]

Where:
  Fast = Haiku, temp 0.3, 1K tokens
  Balanced = Sonnet, temp 0.5, 2K tokens
  Thorough = Opus, temp 0.7, 4K tokens
```

**Progressive Disclosure**:
```
Default view: [Essential options only]
"Advanced" toggle: [Power user options]
"Contact us": [Quote-required options]
```

### Configuration Schema

```json
{
  "starter": {
    "allowed": ["option1", "option2"],
    "limits": { "monthly_ops": 1000 }
  },
  "pro": {
    "allowed": ["option1", "option2", "option3", "option4"],
    "limits": { "monthly_ops": 10000 }
  },
  "enterprise": {
    "allowed": ["*"],
    "limits": { "monthly_ops": "custom" }
  }
}
```

### Support Impact Estimate

| Tier | Expected Config Questions/Mo |
|------|------------------------------|
| Starter | Low (presets handle most) |
| Pro | Medium (advanced options) |
| Enterprise | Low (dedicated support) |
```

## Example Analysis

**Input**: "AI Scraper: URL patterns, extraction rules, output format, model selection, concurrency, retry logic, custom prompts, webhooks, proxy settings"

**Output**:
```markdown
## Entitlements Design: AI Scraper

### Capability Exposure Matrix

| Capability | Level | Tier | Rationale |
|------------|-------|------|-----------|
| Target URL | 1-Preset | All | Core functionality, validate patterns |
| Output format (JSON/CSV) | 2-Basic | All | Common need, no risk |
| Extraction fields (preset list) | 1-Preset | All | Curated options reduce confusion |
| Custom extraction rules | 3-Advanced | Pro | Power users, moderate support risk |
| Model selection | 0-Hidden | - | Cost implications, expose as "quality" preset |
| Concurrency | 0-Hidden | - | Can break things, abuse potential |
| Retry logic | 3-Advanced | Pro | Edge case tuning, low risk |
| Custom prompts | 5-Custom | Quote | Requires review, high support risk |
| Webhooks | 3-Advanced | Pro | Integration need, moderate complexity |
| Proxy settings | 4-Full | Enterprise | Technical, compliance use cases |

### Tier Summary

**Starter** ($29/mo):
- Target URL with pattern validation
- Output: JSON or CSV
- Preset extraction templates (Events, Products, Articles)
- 500 scrapes/month
- Email support

**Pro** ($99/mo):
- Everything in Starter
- Custom extraction rules (10 saved)
- Retry configuration
- Webhook notifications
- 5,000 scrapes/month
- Priority support

**Enterprise** (Custom):
- Everything in Pro
- Proxy/IP rotation settings
- Unlimited saved rules
- Custom scrape limits
- Dedicated support
- SLA available

### Hidden (Internal Only)

| Capability | Reason Hidden |
|------------|---------------|
| Model selection | Exposed as "Quality" preset instead |
| Concurrency | Abuse risk, managed internally for fairness |
| Raw token limits | Confusing, managed via "Quality" preset |

### Quote Required

| Request Type | Why Quote Required |
|--------------|-------------------|
| Custom prompts | High support risk, needs review |
| SLA guarantees | Legal/contractual |
| Dedicated infrastructure | Resource allocation |
| White-label/reseller | Business terms needed |

### UI Recommendations

**Preset Strategy**:
```
Instead of exposing:
  - Model: [gpt-4o / gpt-4 / claude-sonnet / ...]
  - Max tokens: [1000-50000]

Expose as:
  - Quality: [Standard / Enhanced]

Where:
  Standard = Sonnet, optimized prompts (faster, cheaper)
  Enhanced = Opus, thorough prompts (better on messy HTML)
```

**Progressive Disclosure**:
```
┌─────────────────────────────────────┐
│ New Scrape                          │
├─────────────────────────────────────┤
│ URL: [________________________]     │
│                                     │
│ Extract: [Events ▼]                 │
│                                     │
│ Quality: ○ Standard  ● Enhanced     │
│                                     │
│ ▸ Advanced options                  │  ← Pro users only
│                                     │
│ [Scrape Now]                        │
└─────────────────────────────────────┘
```

### Support Impact Estimate

| Tier | Expected Config Questions/Mo | Rationale |
|------|------------------------------|-----------|
| Starter | ~2% of users | Presets cover 95% of needs |
| Pro | ~8% of users | Advanced options need guidance |
| Enterprise | ~1% of users | Dedicated CSM handles |
```

## Integration

Works with:
- `token-economics` - cost implications of exposed options
- `saas-pricing-strategist` - tier pricing decisions
- `cost-observability` - track which options drive costs
