---
name: caching-analyzer
description: Analyze where an app needs caching layers to reduce costs and improve performance
context: fork
model: opus
tools:
  - Read
  - Glob
  - Grep
---

# Caching Analyzer

Identify where your application needs caching layers to reduce token costs, API calls, and latency.

## Why This Matters for Token-Based Products

```
Without Caching:
  User A requests summary of doc_123 → 10K tokens → $0.05
  User B requests summary of doc_123 → 10K tokens → $0.05
  User C requests summary of doc_123 → 10K tokens → $0.05
  Total: 30K tokens, $0.15

With Caching:
  User A requests summary of doc_123 → 10K tokens → $0.05
  User B requests summary of doc_123 → Cache hit → $0.00
  User C requests summary of doc_123 → Cache hit → $0.00
  Total: 10K tokens, $0.05 (67% savings)
```

## Modes

| Mode | When to Use | Input |
|------|-------------|-------|
| `audit` | Have existing codebase | Code path |
| `design` | Planning new feature | Feature description |
| `estimate` | Want cost impact | Audit results + usage data |

---

## Audit Mode

Scan codebase to find caching opportunities.

### Input

```
audit: src/
audit: src/features/scraper/ - focus on LLM calls
audit: src/api/ - check API route caching
```

### Process

1. **Find Cacheable Operations**

   | Operation Type | Pattern to Find | Cache Benefit |
   |----------------|-----------------|---------------|
   | LLM calls | `openai.`, `anthropic.`, `ai.` | HIGH - expensive |
   | Database queries | `prisma.`, `db.query`, `SELECT` | MEDIUM |
   | External APIs | `fetch(`, `axios.`, `http.` | MEDIUM |
   | Computations | Heavy transforms, parsing | LOW-MEDIUM |
   | Auth lookups | `getUser`, `getSession` | LOW but frequent |

2. **Analyze Call Patterns**

   For each cacheable operation:
   - Is the input deterministic?
   - How often is it called with same inputs?
   - What's the cost per call?
   - How stale can the result be?

3. **Identify Cache Keys**

   ```typescript
   // Example: LLM call with cacheable inputs
   const summary = await ai.summarize(documentId, options);

   // Potential cache key:
   // `summary:${documentId}:${hash(options)}`
   ```

4. **Recommend Strategy**

   | Scenario | Strategy |
   |----------|----------|
   | Same exact inputs | Direct key-value cache |
   | Similar inputs | Semantic cache (embeddings) |
   | User-specific | Per-user cache namespace |
   | Expensive + rare changes | Long TTL + invalidation |
   | Cheap + frequent changes | Short TTL |

### Output (Audit Mode)

```markdown
## Caching Analysis: [Project]

### Executive Summary

| Metric | Value |
|--------|-------|
| Cacheable operations found | 12 |
| Estimated monthly cost | $2,400 |
| Potential savings with caching | $1,680 (70%) |
| Implementation effort | ~16 hours |

### High-Impact Opportunities

#### 1. Document Summarization (HIGH PRIORITY)

**Location**: `src/features/summarizer/summarize.ts:34`

**Current code**:
```typescript
export async function summarizeDocument(docId: string) {
  const doc = await getDocument(docId);
  const summary = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Summarize: ${doc.content}` }]
  });
  return summary.choices[0].message.content;
}
```

**Problem**:
- Called ~500 times/day
- Same document summarized multiple times
- ~8K tokens per call = $0.04/call
- Current cost: ~$600/month

**Recommended caching**:
```typescript
import { cache } from '@/lib/cache';

export async function summarizeDocument(docId: string) {
  const cacheKey = `summary:${docId}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const doc = await getDocument(docId);
  const summary = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Summarize: ${doc.content}` }]
  });

  const result = summary.choices[0].message.content;

  // Cache for 24 hours (doc rarely changes)
  await cache.set(cacheKey, result, { ttl: 86400 });

  return result;
}
```

**Cache strategy**:
- Type: Key-value (Redis or in-memory)
- Key: `summary:${docId}`
- TTL: 24 hours
- Invalidation: On document update

**Expected impact**:
- Cache hit rate: ~85% (based on access patterns)
- Cost reduction: $510/month
- Latency improvement: ~2s → ~50ms for cache hits

---

#### 2. Web Scraper Results (HIGH PRIORITY)

**Location**: `src/features/scraper/scrape.ts:45`

**Current code**:
```typescript
export async function scrapeUrl(url: string, template: string) {
  const html = await fetchPage(url);
  const extracted = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Extract ${template} from: ${html}` }]
  });
  return JSON.parse(extracted.choices[0].message.content);
}
```

**Problem**:
- Same URLs scraped repeatedly
- ~12K tokens per scrape = $0.09/scrape
- Some URLs scraped 10+ times/day

**Recommended caching**:
```typescript
import { cache } from '@/lib/cache';
import { hash } from '@/lib/utils';

export async function scrapeUrl(url: string, template: string) {
  const cacheKey = `scrape:${hash(url)}:${template}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const html = await fetchPage(url);
  const extracted = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Extract ${template} from: ${html}` }]
  });

  const result = JSON.parse(extracted.choices[0].message.content);

  // Cache for 1 hour (pages change)
  await cache.set(cacheKey, result, { ttl: 3600 });

  return result;
}
```

**Cache strategy**:
- Type: Key-value with URL hash
- Key: `scrape:${urlHash}:${template}`
- TTL: 1 hour (configurable per-URL)
- Invalidation: Time-based only

**Expected impact**:
- Cache hit rate: ~40% (URLs repeat within hour)
- Cost reduction: $360/month

---

#### 3. User Session Lookups (MEDIUM PRIORITY)

**Location**: `src/middleware/auth.ts:12`

**Current code**:
```typescript
export async function getUser(sessionToken: string) {
  return await prisma.user.findUnique({
    where: { sessionToken },
    include: { subscription: true, usage: true }
  });
}
```

**Problem**:
- Called on every API request
- ~50,000 calls/day
- DB query ~20ms each
- Adds latency to every request

**Recommended caching**:
```typescript
import { cache } from '@/lib/cache';

export async function getUser(sessionToken: string) {
  const cacheKey = `user:session:${sessionToken}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { sessionToken },
    include: { subscription: true, usage: true }
  });

  if (user) {
    // Short TTL - user data can change
    await cache.set(cacheKey, user, { ttl: 300 });
  }

  return user;
}

// Invalidation helper
export async function invalidateUserCache(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.sessionToken) {
    await cache.delete(`user:session:${user.sessionToken}`);
  }
}
```

**Cache strategy**:
- Type: In-memory (fast) or Redis (distributed)
- TTL: 5 minutes
- Invalidation: On user update, subscription change, usage update

---

### Medium-Impact Opportunities

| Location | Operation | Est. Savings | Effort |
|----------|-----------|--------------|--------|
| `src/api/search.ts:23` | Embedding generation | $120/mo | 2hrs |
| `src/lib/pricing.ts:45` | Plan feature lookups | $0 (but -50ms latency) | 1hr |
| `src/features/chat/context.ts:12` | Context retrieval | $200/mo | 3hrs |

### Low-Impact (Skip for Now)

| Location | Operation | Reason to Skip |
|----------|-----------|----------------|
| `src/api/webhook.ts` | Webhook delivery | Already async, no user impact |
| `src/cron/cleanup.ts` | Batch cleanup | Runs once/day, not worth caching |

---

### Recommended Cache Infrastructure

Based on your stack and needs:

**Option A: Redis (Recommended)**
```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, options?: { ttl?: number }) {
    const serialized = JSON.stringify(value);
    if (options?.ttl) {
      await redis.setex(key, options.ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async delete(key: string) {
    await redis.del(key);
  }
};
```

**Why Redis**:
- Your app is deployed on Vercel (needs distributed cache)
- Multiple serverless functions need shared cache
- Use Upstash Redis for serverless-friendly pricing

**Option B: In-Memory (for single-instance)**
```typescript
// lib/cache.ts
import { LRUCache } from 'lru-cache';

const lru = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour default
});

export const cache = {
  get: <T>(key: string) => lru.get(key) as T | undefined,
  set: (key: string, value: any, opts?: { ttl?: number }) =>
    lru.set(key, value, { ttl: opts?.ttl ? opts.ttl * 1000 : undefined }),
  delete: (key: string) => lru.delete(key),
};
```

---

### Implementation Priority

| Week | Task | Impact |
|------|------|--------|
| 1 | Set up Redis/Upstash | Foundation |
| 1 | Cache document summaries | $510/mo saved |
| 2 | Cache scraper results | $360/mo saved |
| 2 | Cache user sessions | -50ms latency |
| 3 | Cache embeddings | $120/mo saved |
| 3 | Add cache metrics dashboard | Visibility |

### Monitoring Recommendations

Track these metrics:
- Cache hit rate (target: >70% for LLM calls)
- Cache miss cost (tokens spent on misses)
- Cache size / memory usage
- Invalidation frequency
- Stale data incidents

```typescript
// Instrumented cache wrapper
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const start = Date.now();
    const result = await redis.get(key);

    metrics.increment(result ? 'cache.hit' : 'cache.miss', {
      key_prefix: key.split(':')[0]
    });
    metrics.timing('cache.latency', Date.now() - start);

    return result ? JSON.parse(result) : null;
  },
  // ...
};
```
```

---

## Design Mode

Design caching strategy for a new feature.

### Input

```
design: document Q&A feature - users ask questions about uploaded docs,
uses embeddings for retrieval, GPT-4 for answers
```

### Output

Provides caching architecture before you build:
- What to cache at each layer
- Cache key design
- TTL strategy
- Invalidation triggers
- Infrastructure recommendations

---

## Estimate Mode

Calculate cost impact of caching recommendations.

### Input

```
estimate: apply audit results to our usage data at /data/metrics.csv
```

### Output

Detailed cost projection:
- Current monthly cost
- Projected cost with caching
- Savings by cache layer
- ROI on implementation effort

---

## Semantic Caching (Advanced)

For LLM calls where inputs are similar but not identical:

```typescript
// Traditional cache: MISS (different wording)
"Summarize this document" → cache miss
"Give me a summary of this doc" → cache miss (different key!)

// Semantic cache: HIT (same meaning)
"Summarize this document" → generates embedding → stores result
"Give me a summary of this doc" → generates embedding → similar! → cache hit
```

**When to use semantic caching**:
- Chat/conversational features
- Search queries
- Question answering

**Implementation**:
```typescript
import { embed } from '@/lib/embeddings';
import { vectorStore } from '@/lib/vector';

export async function semanticCache<T>(
  input: string,
  generateFn: () => Promise<T>,
  options: { similarity: number; ttl: number }
): Promise<T> {
  const embedding = await embed(input);

  // Check for similar cached results
  const similar = await vectorStore.search(embedding, {
    threshold: options.similarity, // e.g., 0.95
    namespace: 'cache'
  });

  if (similar.length > 0) {
    return similar[0].metadata.result as T;
  }

  // Generate and cache
  const result = await generateFn();

  await vectorStore.upsert({
    id: `cache:${Date.now()}`,
    embedding,
    metadata: { result, input, createdAt: Date.now() }
  });

  return result;
}
```

---

## Integration

Works with:
- `token-economics` - caching directly reduces token costs
- `cost-observability` - track cache hit rates and savings
- `api-customer-experience` - cached responses are faster
