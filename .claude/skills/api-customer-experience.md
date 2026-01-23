---
name: api-customer-experience
description: Design and audit APIs for token-based product customer experience
context: fork
model: opus
tools:
  - Read
  - Glob
  - Grep
---

# API Customer Experience

Design and audit APIs that help customers understand costs, usage, and limits in token-based products.

## Modes

| Mode | When to Use | Input |
|------|-------------|-------|
| `design` | Building new API | Feature description |
| `audit` | Have existing API | Codebase path |
| `spec` | Need OpenAPI/docs | Feature or audit output |

## The Problem This Solves

Token-based APIs often frustrate customers because:
- No idea what an operation will cost until it runs
- No real-time feedback on usage
- Cryptic errors when hitting limits
- Must visit dashboard to check quota
- Surprised by bills

**Good API CX means**: Customers always know where they stand.

---

## Audit Mode

Scan existing API code to find customer experience gaps.

### Input

```
audit: src/app/api/
audit: src/routes/ - focus on scraper endpoints
audit: pages/api/ - Next.js API routes
```

### Process

1. **Discover Endpoints**
   - Scan for route definitions
   - Map HTTP methods and paths
   - Identify which consume tokens/credits

2. **Check CX Patterns**

   | Pattern | What to Look For |
   |---------|------------------|
   | Estimation | `/estimate` or `?dryRun=true` endpoint |
   | Usage headers | `X-Credits-*`, `X-RateLimit-*` in responses |
   | Usage endpoint | `/usage`, `/quota`, `/balance` |
   | Structured errors | JSON errors with codes, limits, reset times |
   | Retry guidance | `Retry-After` header on 429s |
   | Webhooks | Quota alert webhooks |

3. **Review Error Handling**
   - Find error response patterns
   - Check for limit/quota error types
   - Assess message clarity

4. **Analyze Response Structure**
   - Are costs returned with results?
   - Is usage info included?
   - Can clients track spending?

5. **Generate Gap Report**

### Output (Audit Mode)

```markdown
## API Customer Experience Audit: [Project]

### Endpoints Analyzed

| Method | Path | Consumes Credits | CX Score |
|--------|------|------------------|----------|
| POST | /api/scrape | Yes | 2/10 |
| GET | /api/scrapes/:id | No | 6/10 |
| GET | /api/scrapes | No | 6/10 |

### CX Pattern Checklist

#### Pre-Operation Transparency
| Pattern | Status | Location |
|---------|--------|----------|
| Estimate endpoint | ❌ Missing | - |
| Dry-run parameter | ❌ Missing | - |
| Cost preview in UI | ❓ Unknown | Check frontend |

#### Real-Time Feedback
| Pattern | Status | Location |
|---------|--------|----------|
| Usage headers | ❌ Missing | - |
| Cost in response body | ❌ Missing | - |
| Running total | ❌ Missing | - |

#### Usage Self-Service
| Pattern | Status | Location |
|---------|--------|----------|
| Usage endpoint | ❌ Missing | - |
| Breakdown by feature | ❌ Missing | - |
| Historical usage | ❌ Missing | - |
| Export capability | ❌ Missing | - |

#### Limit Communication
| Pattern | Status | Location |
|---------|--------|----------|
| Structured error responses | ⚠️ Partial | `src/api/scrape.ts:45` |
| Error codes (not just messages) | ❌ Missing | - |
| Limit info in errors | ❌ Missing | - |
| Reset time in errors | ❌ Missing | - |
| Upgrade path in errors | ❌ Missing | - |
| Retry-After header | ❌ Missing | - |

#### Proactive Alerts
| Pattern | Status | Location |
|---------|--------|----------|
| Usage threshold webhooks | ❌ Missing | - |
| Email alerts | ❓ Unknown | Check notification service |
| Approaching limit warning | ❌ Missing | - |

### Current vs. Recommended

#### Error Response

**Current** (`src/api/scrape.ts:45`):
```typescript
if (overLimit) {
  return res.status(429).json({
    error: "Rate limit exceeded"
  });
}
```

**Recommended**:
```typescript
if (overLimit) {
  return res.status(429)
    .setHeader('Retry-After', secondsUntilReset)
    .json({
      error: {
        code: "QUOTA_EXCEEDED",
        message: "Monthly credit limit reached",
        type: "quota_error",
      },
      usage: {
        used: currentUsage,
        limit: planLimit,
        period: "2026-01",
        resets_at: resetDate.toISOString(),
      },
      options: {
        upgrade_url: `${baseUrl}/upgrade`,
        buy_credits_url: `${baseUrl}/credits`,
      }
    });
}
```

#### Success Response

**Current**:
```typescript
return res.json({
  events: extractedEvents
});
```

**Recommended**:
```typescript
return res
  .setHeader('X-Credits-Used', creditsUsed)
  .setHeader('X-Credits-Remaining', remaining)
  .setHeader('X-Request-Cost', `${creditsUsed} credits`)
  .json({
    data: { events: extractedEvents },
    meta: {
      credits_used: creditsUsed,
      credits_remaining: remaining,
      tokens_consumed: tokenCount,
    }
  });
```

### Priority Recommendations

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 HIGH | Add estimate endpoint | 4hrs | Prevents bill shock |
| 🔴 HIGH | Add usage headers | 2hrs | Real-time awareness |
| 🔴 HIGH | Structured error responses | 3hrs | Clear limit communication |
| 🟡 MED | Add /usage endpoint | 4hrs | Self-service quota check |
| 🟡 MED | Add Retry-After header | 1hr | Client retry logic |
| 🟢 LOW | Usage webhooks | 6hrs | Proactive alerts |

### Implementation Checklist

- [ ] Create `/api/scrape/estimate` endpoint
- [ ] Add response middleware for usage headers
- [ ] Refactor error responses with structured format
- [ ] Create `/api/usage` endpoint
- [ ] Create `/api/usage/breakdown` endpoint
- [ ] Add `Retry-After` to 429 responses
- [ ] Document new headers in API docs
- [ ] Update SDK/client libraries (if any)
```

---

## Design Mode

Design new API endpoints with CX best practices built in.

### Input

```
design: scraper API - runs AI extraction, costs 1-5 credits per page
design: document summarizer - variable cost based on doc length
design: chatbot API - per-message billing
```

### Output (Design Mode)

```markdown
## API Design: [Feature]

### Endpoint Structure

#### Core Operations
```
POST /api/v1/scrape           # Execute scrape
POST /api/v1/scrape/estimate  # Preview cost
POST /api/v1/scrape/batch     # Batch operations
GET  /api/v1/scrape/:id       # Get result
GET  /api/v1/scrapes          # List scrapes
```

#### Usage & Billing
```
GET /api/v1/usage                    # Current period usage
GET /api/v1/usage/breakdown          # By feature
GET /api/v1/usage/history            # Historical
GET /api/v1/quota                    # Limits and remaining
```

#### Webhooks (Customer Configures)
```
POST [customer_url]  # usage.threshold (80%, 90%, 100%)
POST [customer_url]  # usage.limit_reached
POST [customer_url]  # credits.low_balance
```

### Estimate Endpoint

```typescript
// POST /api/v1/scrape/estimate
// Request
{
  "url": "https://example.com/events",
  "extraction_template": "events"
}

// Response
{
  "estimate": {
    "credits": { "min": 2, "max": 5, "typical": 3 },
    "tokens": { "min": 8000, "max": 20000, "typical": 12000 },
    "confidence": "medium",
    "factors": [
      "Page size estimated at 45KB",
      "Events template typically extracts 5-15 items"
    ]
  },
  "current_balance": 47,
  "sufficient_balance": true,
  "warnings": []
}
```

### Execute Endpoint

```typescript
// POST /api/v1/scrape
// Request
{
  "url": "https://example.com/events",
  "extraction_template": "events",
  "options": {
    "max_credits": 5  // Fail if would exceed
  }
}

// Response Headers
X-Credits-Used: 3
X-Credits-Remaining: 44
X-Request-Id: req_abc123
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1706140800

// Response Body
{
  "id": "scrape_xyz789",
  "status": "completed",
  "data": {
    "events": [...]
  },
  "meta": {
    "credits_used": 3,
    "credits_remaining": 44,
    "tokens": { "input": 11420, "output": 890 },
    "duration_ms": 2340,
    "model": "gpt-4o"
  }
}
```

### Error Responses

```typescript
// 402 Payment Required - Out of credits
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "This operation requires ~3 credits, but you have 1 remaining",
    "type": "payment_error"
  },
  "required": { "min": 2, "typical": 3 },
  "available": 1,
  "options": {
    "buy_credits": "https://app.example.com/credits",
    "upgrade": "https://app.example.com/upgrade"
  }
}

// 429 Too Many Requests - Rate/Quota limit
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly credit limit of 500 reached",
    "type": "quota_error"
  },
  "usage": {
    "used": 500,
    "limit": 500,
    "period": "2026-01"
  },
  "resets_at": "2026-02-01T00:00:00Z",
  "retry_after": 864000,
  "options": {
    "upgrade": "https://app.example.com/upgrade",
    "buy_credits": "https://app.example.com/credits"
  }
}

// 400 Bad Request - Would exceed max_credits
{
  "error": {
    "code": "ESTIMATED_COST_EXCEEDS_LIMIT",
    "message": "Estimated cost (8 credits) exceeds your max_credits limit (5)",
    "type": "validation_error"
  },
  "estimate": { "min": 6, "max": 10, "typical": 8 },
  "your_limit": 5,
  "suggestions": [
    "Increase max_credits parameter",
    "Use a simpler extraction template",
    "Target a smaller page"
  ]
}
```

### Usage Endpoint

```typescript
// GET /api/v1/usage
{
  "period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-31T23:59:59Z",
    "type": "monthly"
  },
  "credits": {
    "used": 342,
    "limit": 500,
    "remaining": 158,
    "percent_used": 68.4
  },
  "operations": {
    "total": 127,
    "successful": 119,
    "failed": 8
  },
  "plan": {
    "name": "Pro",
    "credits_included": 500,
    "overage_rate": "$0.10/credit"
  },
  "alerts": {
    "approaching_limit": false,
    "threshold_80_reached": false
  }
}

// GET /api/v1/usage/breakdown
{
  "period": "2026-01",
  "by_feature": [
    { "feature": "scrape", "credits": 280, "operations": 95 },
    { "feature": "summarize", "credits": 62, "operations": 32 }
  ],
  "by_day": [
    { "date": "2026-01-20", "credits": 23 },
    { "date": "2026-01-21", "credits": 31 }
  ]
}
```

### Standard Headers (All Responses)

| Header | Description | Example |
|--------|-------------|---------|
| `X-Request-Id` | Unique request ID | `req_abc123` |
| `X-Credits-Used` | Credits consumed (if any) | `3` |
| `X-Credits-Remaining` | Balance after request | `44` |
| `X-RateLimit-Limit` | Requests per window | `100` |
| `X-RateLimit-Remaining` | Requests left in window | `87` |
| `X-RateLimit-Reset` | Window reset (Unix timestamp) | `1706140800` |
| `Retry-After` | Seconds to wait (on 429) | `3600` |

### Webhook Events

```typescript
// usage.threshold
{
  "event": "usage.threshold",
  "threshold": 80,
  "usage": { "used": 400, "limit": 500, "percent": 80 },
  "timestamp": "2026-01-21T14:30:00Z"
}

// usage.limit_reached
{
  "event": "usage.limit_reached",
  "usage": { "used": 500, "limit": 500 },
  "resets_at": "2026-02-01T00:00:00Z",
  "timestamp": "2026-01-21T18:45:00Z"
}
```
```

---

## Spec Mode

Generate OpenAPI specification or API documentation.

### Input

```
spec: generate OpenAPI for scraper API design above
spec: update our existing openapi.yaml with CX improvements
```

### Output

Generates OpenAPI 3.0+ YAML with all CX patterns documented.

---

## Integration

Works with:
- `token-economics` - cost basis for estimates
- `entitlements-designer` - what limits apply per tier
- `cost-observability` - metrics that power usage endpoints
- `saas-pricing-strategist` - pricing shown in error upgrade paths

---

## Framework-Specific Patterns

### Next.js API Routes

```typescript
// middleware.ts - Add usage headers to all API responses
import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  const response = NextResponse.next();

  // Add after request processing
  const usage = await getUserUsage(userId);
  response.headers.set('X-Credits-Remaining', usage.remaining);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Express Middleware

```typescript
// middleware/usageHeaders.ts
export function usageHeaders() {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = async function(body) {
      const usage = await getUserUsage(req.user.id);
      res.setHeader('X-Credits-Remaining', usage.remaining);
      res.setHeader('X-RateLimit-Remaining', usage.rateLimit.remaining);
      return originalJson.call(this, body);
    };

    next();
  };
}
```

### FastAPI Middleware

```python
# middleware/usage_headers.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class UsageHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if hasattr(request.state, 'user'):
            usage = await get_user_usage(request.state.user.id)
            response.headers['X-Credits-Remaining'] = str(usage.remaining)

        return response
```
