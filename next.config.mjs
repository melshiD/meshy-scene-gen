/** @type {import('next').NextConfig} */

// Allow next/image to load persisted assets from Cloudflare R2. R2 public buckets serve from
// *.r2.dev by default, or a custom domain set via STORAGE_PUBLIC_URL — add whichever is configured
// at build time. DALL·E / Meshy temporary CDN URLs are still allowed for pre-persist previews.
const remotePatterns = [
  { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
  { protocol: 'https', hostname: 'assets.meshy.ai' },
  { protocol: 'https', hostname: '**.r2.dev' },
];

if (process.env.STORAGE_PUBLIC_URL) {
  try {
    const { hostname } = new URL(process.env.STORAGE_PUBLIC_URL);
    if (hostname && !remotePatterns.some((p) => p.hostname === hostname)) {
      remotePatterns.push({ protocol: 'https', hostname });
    }
  } catch {
    // STORAGE_PUBLIC_URL not an absolute URL (e.g. dev '/generated') — nothing to add.
  }
}

const nextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
