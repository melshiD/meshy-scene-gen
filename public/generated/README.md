# Generated Assets Directory

This directory stores generated assets during development:
- **Captured scene images** (full, web, thumb resolutions)
- **Background images** (persisted from DALL-E)
- **3D meshes** (persisted from Meshy CDN)

## Directory Structure

```
public/generated/
  capture/{jobId}/
    full-2048x2048.png    # Full resolution PNG
    web-800x800.webp      # Web resolution WebP
    thumb-400x400.webp    # Thumbnail WebP
  background/{jobId}/
    background.png        # Persisted background image
  mesh/{jobId}/
    model.glb             # 3D mesh file (GLB format)
```

## Development Usage

Assets are automatically saved here when running the development server:

```bash
pnpm dev
```

Files are served via Next.js static file serving at `/generated/...`.

**Important:** This directory is gitignored. Do not commit generated assets.

## Production Migration: Cloudflare R2

For production, migrate to Cloudflare R2 cloud storage.

### Why R2?

- **Free tier:** 10GB storage, 1M Class A ops, 10M Class B ops/month
- **S3-compatible:** Uses standard AWS SDK
- **No egress fees:** Unlike S3, no charges for data transfer
- **Global CDN:** Fast access worldwide

### Setup Steps

1. **Create R2 Bucket**

   ```bash
   # Via Cloudflare dashboard or wrangler
   npx wrangler r2 bucket create meshy-scene-assets
   ```

2. **Create API Token**

   - Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens
   - Create token with "Object Read & Write" permissions
   - Note the Access Key ID and Secret Access Key

3. **Configure Environment Variables**

   ```bash
   # .env.production
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret
   R2_BUCKET_NAME=meshy-scene-assets
   R2_PUBLIC_URL=https://pub-xxx.r2.dev  # or custom domain
   ```

4. **Enable Public Access (Optional)**

   For public asset URLs, enable public access on the bucket:
   - R2 Dashboard > Bucket Settings > Public Access > Allow Access

   Or use a custom domain for cleaner URLs.

5. **Deploy**

   The storage module auto-detects R2 configuration and switches providers.

### R2 Provider Implementation

When R2 env vars are detected, the storage module uses `R2StorageProvider`:

```typescript
// Automatic provider selection in src/lib/storage/client.ts
const hasR2Config =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY;

if (hasR2Config) {
  // Uses R2StorageProvider (same interface as filesystem)
}
```

### Cost Estimation

For a typical workload (1000 generations/month):

| Resource | Usage | Cost |
|----------|-------|------|
| Storage | ~5GB | Free |
| Class A (writes) | ~5K | Free |
| Class B (reads) | ~50K | Free |
| Egress | Any | Free |

**Total: $0/month** within free tier.

## Cleanup

To clean up old assets:

```typescript
import { deleteJobAssets } from '@/lib/storage';

// Delete all assets for a specific job
await deleteJobAssets('job-id-here');
```

For automated cleanup, implement a scheduled job (cron) to delete assets older than N days.

## Troubleshooting

### Assets not loading in development

1. Check the file exists: `ls public/generated/capture/{jobId}/`
2. Verify URL path matches: `/generated/capture/{jobId}/full-2048x2048.png`
3. Restart the dev server if files were added while running

### Large disk usage

Generated meshes can be 5-50MB each. Monitor disk usage and implement cleanup:

```bash
# Check usage
du -sh public/generated/

# Manual cleanup (removes all generated assets)
rm -rf public/generated/*/
```

### CORS issues with R2

Configure CORS on your R2 bucket:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```
