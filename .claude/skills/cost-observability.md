---
name: cost-observability
description: Set up instrumentation for tracking token usage, costs, and value delivery
context: fork
model: opus
---

# Cost Observability

Set up instrumentation for tracking token usage, costs, customer value, and margin health.

## When to Use

- Launching an AI-powered feature
- Investigating cost overruns
- Setting up customer usage dashboards
- Implementing budget alerts
- Debugging margin issues

## Input

$ARGUMENTS should describe:
- **Stack**: Your tech stack (will ask if not specified)
- **Features**: Which features to instrument
- **Metrics focus**: Cost, value, or both
- **Existing setup** (optional): Current observability tools

**Example inputs**:
```
"Set up cost tracking for AI scraper feature, Next.js + Vercel"

"Add token observability to our FastAPI backend,
 we use Datadog for monitoring"

"Full cost + value tracking for document processor,
 Node.js, need customer-facing usage dashboard"
```

## Process

### 1. Assess Current State

Identify:
- Existing logging/monitoring
- Database for metrics storage
- Dashboard tools available
- Alert systems in place

### 2. Define Metrics Schema

Core metrics to track:

**Cost Metrics**:
```typescript
interface CostMetrics {
  // Per-operation
  operation_id: string;
  feature: string;
  timestamp: Date;

  // Token usage
  input_tokens: number;
  output_tokens: number;
  model: string;

  // Cost calculation
  token_cost_usd: number;
  infra_cost_usd: number;
  total_cost_usd: number;

  // Attribution
  customer_id: string;
  tier: string;
}
```

**Value Metrics**:
```typescript
interface ValueMetrics {
  operation_id: string;

  // Output measurement
  output_units: number;      // e.g., events extracted
  output_type: string;       // e.g., "event", "summary"
  success: boolean;

  // Derived
  cost_per_unit: number;     // total_cost / output_units
  value_score: number;       // custom value metric
}
```

**Customer Metrics**:
```typescript
interface CustomerMetrics {
  customer_id: string;
  period: string;            // "2026-01"

  // Usage
  operations_count: number;
  tokens_consumed: number;
  credits_used: number;

  // Cost
  total_cost_usd: number;

  // Revenue
  plan_revenue_usd: number;
  overage_revenue_usd: number;

  // Margin
  gross_margin_pct: number;
}
```

### 3. Instrumentation Points

Identify where to add tracking:

```
Request Flow:

  API Request ──► Auth/Rate Limit ──► Feature Logic ──► LLM Call ──► Response
       │                │                   │              │            │
       ▼                ▼                   ▼              ▼            ▼
  [customer_id]    [tier/limits]      [feature_id]   [tokens/cost]  [output_value]
                                                          │
                                                          ▼
                                               [Metrics Storage]
```

### 4. Generate Implementation

Based on stack, provide:
- Code snippets for instrumentation
- Database schema for metrics
- Dashboard specifications
- Alert rules

## Output

```markdown
## Cost Observability Setup: [Feature/Product]

### Metrics Schema

**Database table(s)**:
```sql
-- Operation-level metrics
CREATE TABLE operation_metrics (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  customer_id UUID NOT NULL,
  feature VARCHAR(50) NOT NULL,

  -- Token tracking
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  model VARCHAR(50) NOT NULL,

  -- Cost tracking
  token_cost_cents INT NOT NULL,
  infra_cost_cents INT NOT NULL,
  total_cost_cents INT NOT NULL,

  -- Value tracking
  output_units INT,
  success BOOLEAN NOT NULL,

  -- Indexes
  INDEX idx_customer_time (customer_id, timestamp),
  INDEX idx_feature_time (feature, timestamp)
);

-- Daily rollups for dashboards
CREATE TABLE daily_customer_metrics (
  date DATE NOT NULL,
  customer_id UUID NOT NULL,

  operations INT NOT NULL,
  tokens_consumed BIGINT NOT NULL,
  total_cost_cents INT NOT NULL,
  revenue_cents INT NOT NULL,
  margin_pct DECIMAL(5,2),

  PRIMARY KEY (date, customer_id)
);
```

### Instrumentation Code

**[Stack-specific code snippets]**

Example (TypeScript/Node):
```typescript
// lib/observability.ts

interface OperationMetrics {
  customerId: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  outputUnits?: number;
  success: boolean;
}

const TOKEN_COSTS = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'claude-sonnet': { input: 0.003, output: 0.015 },
  // ... add models
};

export async function trackOperation(metrics: OperationMetrics) {
  const costs = TOKEN_COSTS[metrics.model];
  const tokenCost =
    (metrics.inputTokens / 1000) * costs.input +
    (metrics.outputTokens / 1000) * costs.output;

  const infraCost = tokenCost * 0.15; // 15% overhead
  const totalCost = tokenCost + infraCost;

  await db.operationMetrics.create({
    data: {
      timestamp: new Date(),
      customerId: metrics.customerId,
      feature: metrics.feature,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
      model: metrics.model,
      tokenCostCents: Math.round(tokenCost * 100),
      infraCostCents: Math.round(infraCost * 100),
      totalCostCents: Math.round(totalCost * 100),
      outputUnits: metrics.outputUnits,
      success: metrics.success,
    }
  });

  // Real-time alerts
  await checkAlerts(metrics.customerId, totalCost);
}

// Usage in feature code:
const result = await aiScraper.scrape(url);
await trackOperation({
  customerId: user.id,
  feature: 'scraper',
  inputTokens: result.usage.inputTokens,
  outputTokens: result.usage.outputTokens,
  model: 'gpt-4o',
  outputUnits: result.events.length,
  success: result.events.length > 0,
});
```

### Dashboard Specifications

**Admin Dashboard**:
```
┌─────────────────────────────────────────────────────────────┐
│ Cost Overview (Last 30 Days)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total Cost: $4,521    Revenue: $12,340    Margin: 63.4%   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Daily Cost vs Revenue                         [📈]  │   │
│  │ [Chart: stacked area, cost vs revenue over time]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Cost by Feature          │  Cost by Customer (Top 10)     │
│  ├── Scraper: $3,200      │  ├── customer_a: $521          │
│  ├── Summarizer: $890     │  ├── customer_b: $412          │
│  └── Chatbot: $431        │  └── ...                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Customer Dashboard**:
```
┌─────────────────────────────────────────────────────────────┐
│ Your Usage This Month                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Credits Used: 342 / 500          ████████████░░░░ 68%     │
│  Resets in: 12 days                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Daily Usage                                   [📊]  │   │
│  │ [Bar chart: credits used per day]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Usage by Feature                                           │
│  ├── Scraper: 280 credits                                   │
│  └── Summarizer: 62 credits                                 │
│                                                             │
│  [Buy More Credits]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Alert Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| **Margin Warning** | Customer margin < 30% | Slack notification |
| **Margin Critical** | Customer margin < 10% | Page on-call |
| **Cost Spike** | Daily cost > 3x 7-day avg | Slack notification |
| **Customer Near Limit** | Usage > 80% of plan | Email customer |
| **Customer Over Limit** | Usage > 100% of plan | Apply overage or throttle |

**Alert Implementation**:
```typescript
// lib/alerts.ts

interface AlertRule {
  name: string;
  condition: (metrics: CustomerMetrics) => boolean;
  action: 'slack' | 'email' | 'page';
  cooldown: number; // minutes
}

const rules: AlertRule[] = [
  {
    name: 'margin_warning',
    condition: (m) => m.gross_margin_pct < 30,
    action: 'slack',
    cooldown: 60 * 24, // once per day
  },
  {
    name: 'margin_critical',
    condition: (m) => m.gross_margin_pct < 10,
    action: 'page',
    cooldown: 60, // once per hour
  },
  // ... more rules
];
```

### Rollup Jobs

Schedule these for dashboards:
```sql
-- Daily rollup (run at midnight UTC)
INSERT INTO daily_customer_metrics
SELECT
  DATE(timestamp) as date,
  customer_id,
  COUNT(*) as operations,
  SUM(input_tokens + output_tokens) as tokens_consumed,
  SUM(total_cost_cents) as total_cost_cents,
  -- Join with billing to get revenue
  -- Calculate margin
FROM operation_metrics
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
  AND timestamp < CURRENT_DATE
GROUP BY DATE(timestamp), customer_id;
```

### Implementation Checklist

- [ ] Create database tables
- [ ] Add instrumentation to LLM calls
- [ ] Implement trackOperation function
- [ ] Set up daily rollup job
- [ ] Build admin dashboard
- [ ] Build customer usage dashboard
- [ ] Configure alert rules
- [ ] Test with sample data
- [ ] Set up log retention policy
```

## Stack-Specific Implementations

### Next.js + Vercel + Postgres

Will provide:
- Prisma schema
- API route middleware
- Vercel Cron for rollups
- React dashboard components

### FastAPI + SQLAlchemy

Will provide:
- SQLAlchemy models
- FastAPI middleware
- Celery tasks for rollups
- Dashboard API endpoints

### Node.js + Express

Will provide:
- Express middleware
- Knex migrations
- Node-cron jobs
- REST API for dashboards

## Integration

Works with:
- `token-economics` - provides cost basis
- `saas-pricing-strategist` - validates margin assumptions
- `entitlements-designer` - enforces limits based on metrics
