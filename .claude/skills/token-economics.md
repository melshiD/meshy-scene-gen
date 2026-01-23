---
name: token-economics
description: Analyze feature token consumption patterns and recommend pricing strategies
context: fork
model: opus
tools:
  - Read
  - Bash
  - Grep
---

# Token Economics Analyzer

Analyze token consumption patterns (both theoretical and from actual data), identify cost-value mismatches, and recommend pricing strategies.

## Modes

| Mode | When to Use | Input |
|------|-------------|-------|
| `design` | Planning a new feature | Feature description, estimated usage |
| `analyze` | Have actual usage data | Data file, query, or codebase access |
| `audit` | Review existing feature | Codebase + optional usage data |

## When to Use

- **Design mode**: Pricing a new AI-powered feature
- **Analyze mode**: Understanding actual token consumption patterns
- **Audit mode**: Finding cost optimization opportunities

## Input

$ARGUMENTS should specify mode and context:

**Design mode**:
```
"design: AI scraper, averages 12K tokens/page, outputs 2-50 events,
 using GPT-4o"
```

**Analyze mode**:
```
"analyze: usage data in /data/scraper_metrics.csv"

"analyze: query our metrics table for last 30 days of scraper usage"

"analyze: look at our OpenAI usage dashboard export"
```

**Audit mode**:
```
"audit: review our scraper implementation for token optimization"

"audit: src/features/scraper/ - find token waste"
```

---

## Design Mode

For theoretical analysis when planning features.

### Process

1. **Load Knowledge Base**
   - Read `scaffold/knowledge/saas-pricing-models.md`
   - Get current token costs, margin targets

2. **Calculate Unit Economics**
   ```
   Per-Operation Cost:
   ├── Input tokens × input rate
   ├── Output tokens × output rate
   ├── Infrastructure overhead (~10-20%)
   └── Total cost per operation
   ```

3. **Analyze Value-to-Cost Ratio**
   - Best case / typical / worst case scenarios
   - Variance factor (worst/best)

4. **Recommend Pricing Strategy**
   - Based on variance and value alignment
   - Credit abstraction if high variance

5. **Suggest Optimizations**
   - Model downgrade opportunities
   - Token reduction techniques

### Output (Design Mode)

```markdown
## Token Economics: [Feature] (Design Analysis)

### Cost Breakdown
| Component | Tokens | Rate | Cost |
|-----------|--------|------|------|
| Input | [X]K | $[Y]/1K | $[Z] |
| Output | [X]K | $[Y]/1K | $[Z] |
| **Total** | | | **$[Z]** |

### Variance Analysis
| Scenario | Cost | Output | Cost/Unit |
|----------|------|--------|-----------|
| Best | $X | Y units | $Z/unit |
| Typical | $X | Y units | $Z/unit |
| Worst | $X | Y units | $Z/unit |

**Variance factor**: Xx

### Pricing Recommendation
[Model + rationale]

### Margin Analysis
| Price | Margin | Notes |
|-------|--------|-------|
| $X | Y% | Floor |
| $X | Y% | Target |
```

---

## Analyze Mode

For understanding patterns in actual usage data.

### Process

1. **Load Data**
   - Read CSV/JSON files
   - Query database (provide SQL)
   - Parse API export formats

2. **Pattern Analysis**
   ```
   Token Distribution:
   ├── P50 (median): X tokens
   ├── P90: Y tokens
   ├── P99: Z tokens
   ├── Max: W tokens
   └── Outliers: N operations > 2σ
   ```

3. **Cost-Value Correlation**
   - Tokens vs. output units
   - Identify high-cost-low-value operations
   - Find patterns in expensive operations

4. **Customer Segmentation**
   - Heavy users vs. light users
   - Margin by customer tier
   - Abuse detection

5. **Trend Analysis**
   - Cost trends over time
   - Seasonal patterns
   - Model/prompt changes impact

### Output (Analyze Mode)

```markdown
## Token Economics: [Feature] (Usage Analysis)

### Data Summary
- Period: [date range]
- Operations: [count]
- Total tokens: [sum]
- Total cost: $[X]

### Token Distribution

```
Histogram (tokens per operation):

   0-5K   ████████████████████ 45%
   5-10K  ██████████████ 32%
  10-20K  ██████ 15%
  20-50K  ██ 6%
  50K+    █ 2%  ← investigate these
```

P50: 6,200 tokens
P90: 18,400 tokens
P99: 42,100 tokens
Max: 127,000 tokens

### Cost-Value Analysis

**High-cost-low-value operations** (cost > P90, output < P10):
| Operation ID | Tokens | Cost | Output | Issue |
|--------------|--------|------|--------|-------|
| [id] | 45K | $0.34 | 1 event | [likely cause] |
| [id] | 38K | $0.29 | 0 events | [likely cause] |

**Common patterns in expensive operations**:
1. [Pattern 1] - accounts for X% of high-cost ops
2. [Pattern 2] - accounts for Y% of high-cost ops

### Customer Analysis

**Margin by tier**:
| Tier | Customers | Revenue | Cost | Margin |
|------|-----------|---------|------|--------|
| Starter | 124 | $4,836 | $1,420 | 71% |
| Pro | 45 | $4,455 | $2,100 | 53% |
| Enterprise | 8 | $6,400 | $1,800 | 72% |

**Negative margin customers** (investigate):
| Customer | Plan | Revenue | Cost | Margin |
|----------|------|---------|------|--------|
| [id] | Pro | $99 | $142 | -43% |

### Optimization Opportunities

1. **[Opportunity 1]**
   - Current: [state]
   - Proposed: [change]
   - Impact: -X% tokens, saves $Y/mo

2. **[Opportunity 2]**
   - Current: [state]
   - Proposed: [change]
   - Impact: -X% tokens, saves $Y/mo

### Alerts Recommended

Based on patterns found:
- [ ] Alert when single operation > 50K tokens
- [ ] Alert when customer margin < 20%
- [ ] Alert when P90 increases > 30% week-over-week
```

---

## Audit Mode

For reviewing implementation and finding optimization opportunities.

### Process

1. **Scan Codebase**
   - Find LLM integration points
   - Identify prompt construction
   - Check for token-heavy patterns

2. **Identify Waste Patterns**
   ```
   Common Token Waste:
   ├── Overly verbose prompts
   ├── Redundant context
   ├── No caching
   ├── Wrong model for task
   ├── Full document when summary would work
   └── No streaming (retry = full cost)
   ```

3. **Benchmark Against Best Practices**
   - Prompt efficiency
   - Model selection
   - Caching strategy
   - Error handling

4. **Generate Recommendations**
   - Prioritized by impact
   - With implementation guidance

### Output (Audit Mode)

```markdown
## Token Economics: [Feature] (Code Audit)

### LLM Integration Points

Found [N] LLM calls in codebase:

| Location | Model | Est. Tokens | Purpose |
|----------|-------|-------------|---------|
| `src/scraper/extract.ts:45` | gpt-4o | 8-15K | HTML extraction |
| `src/scraper/classify.ts:23` | gpt-4o | 2-4K | Event classification |

### Waste Patterns Found

**1. Verbose system prompts** (HIGH IMPACT)
```typescript
// src/scraper/extract.ts:12
const systemPrompt = `You are an expert at extracting...
[500+ tokens of instructions that repeat on every call]
```
**Recommendation**: Move static instructions to fine-tuning or compress.
**Savings**: ~400 tokens/call = $X/mo at current volume

**2. No HTML preprocessing** (HIGH IMPACT)
```typescript
// src/scraper/extract.ts:34
const response = await openai.chat({
  messages: [{ content: rawHtml }]  // Full HTML sent
});
```
**Recommendation**: Strip non-content elements before LLM.
**Savings**: ~40% token reduction on average

**3. Expensive model for simple task** (MEDIUM IMPACT)
```typescript
// src/scraper/classify.ts:23
const model = 'gpt-4o';  // Classification doesn't need GPT-4
```
**Recommendation**: Use Haiku for classification task.
**Savings**: ~85% cost reduction for this call

### Optimization Roadmap

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| 1 | HTML preprocessing | 4hrs | -40% tokens |
| 2 | Downgrade classifier to Haiku | 1hr | -85% on that call |
| 3 | Compress system prompt | 2hrs | -5% overall |
| 4 | Add response caching | 8hrs | -20% (repeat URLs) |

### Estimated Total Savings

Current monthly cost: $[X]
After optimizations: $[Y]
Savings: $[Z] ([N]%)
```

---

## Example: Full Analysis Workflow

```
User: "I have my scraper running. Here's the metrics:
       /data/scraper_march_2026.csv

       Also audit the code at src/features/scraper/"

Assistant runs:

1. analyze: Load CSV, generate distribution analysis
2. audit: Scan scraper code for optimization opportunities
3. Cross-reference: Which code patterns cause the expensive operations?
4. Prioritized recommendations with $ impact
```

---

## Data Format Support

### CSV (analyze mode)
```csv
timestamp,customer_id,input_tokens,output_tokens,model,output_units,success
2026-03-01T10:00:00Z,cust_123,12400,1200,gpt-4o,8,true
```

### JSON (analyze mode)
```json
[
  {
    "timestamp": "2026-03-01T10:00:00Z",
    "customer_id": "cust_123",
    "tokens": { "input": 12400, "output": 1200 },
    "model": "gpt-4o",
    "output_units": 8,
    "success": true
  }
]
```

### OpenAI Usage Export
Will parse the standard OpenAI dashboard export format.

### Custom Queries
Provide SQL and connection context:
```
"analyze: SELECT * FROM operation_metrics
 WHERE feature = 'scraper' AND timestamp > '2026-03-01'"
```

---

## Integration

Works with:
- `cost-observability` - uses its data schema, recommends dashboards
- `saas-pricing-strategist` - feeds findings into pricing decisions
- `entitlements-designer` - identifies which options drive cost
