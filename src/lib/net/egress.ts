/**
 * Egress proxy (Lodestar Squid allowlist)
 *
 * On lodestar-core-1 the container is strong-bound: its DIRECT internet route is
 * DROPped at the host firewall, so the ONLY way out is the Squid forward proxy,
 * which allows just the meshy hosts (api.meshy.ai + assets.meshy.ai). Node's
 * global `fetch` (undici) ignores HTTP(S)_PROXY, so an outbound call to an
 * external host must attach an undici ProxyAgent explicitly — otherwise it goes
 * direct and the DROP kills it.
 *
 * Scope is deliberately narrow: ONLY the two external meshy.ai fetches use this.
 * In-cluster calls (LiteLLM at http://litellm:4000, core-Postgres) must NOT be
 * proxied — they stay direct on the app bridge. In local dev EGRESS_PROXY is
 * unset, so this is a no-op and fetch connects directly.
 */
import { ProxyAgent, Client } from 'undici';
import { readFileSync, statSync } from 'node:fs';
import type { PeerCertificate } from 'node:tls';

// undici's fetch reads `dispatcher` off the init object; the DOM RequestInit
// type doesn't declare it, so we widen locally.
type ProxiedInit = RequestInit & { dispatcher?: ProxyAgent };

let cached: ProxyAgent | null | undefined;

function dispatcher(): ProxyAgent | undefined {
  if (cached === undefined) {
    const url = process.env.EGRESS_PROXY;
    cached = url ? new ProxyAgent(url) : null;
  }
  return cached ?? undefined;
}

/**
 * Like `fetch`, but routed through the Squid egress proxy when EGRESS_PROXY is
 * set. Use ONLY for calls to allow-listed EXTERNAL hosts (api/assets.meshy.ai).
 */
export function proxiedFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const d = dispatcher();
  const opts: ProxiedInit = d ? { ...init, dispatcher: d } : init;
  return fetch(input, opts as RequestInit);
}

/**
 * KeyMaster S5 credential injection (DR-0014 §E). On lodestar-core-1 the
 * `api.meshy.ai` leg is routed through Envoy — a credential-injecting terminal
 * egress broker — over mTLS. meshy presents its SPIRE client SVID (fetched by a
 * file-drop sidecar into MESHY_SVID_DIR) and sends NO Authorization header;
 * Envoy authenticates the SVID (RBAC), injects the real MESHY_API_KEY from its
 * SDS credential, and originates TLS to api.meshy.ai. The key never lives in
 * this container. See `injectedFetch`. When MESHY_ENVOY_ORIGIN is unset (local
 * dev) callers fall back to a keyed direct/proxied fetch (see meshy/client.ts).
 *
 * Verified on-box 2026-07-04 (meshy-egress-probe.js → 401→200 with the fed key).
 */
const ENVOY_ORIGIN = process.env.MESHY_ENVOY_ORIGIN;           // e.g. https://lodestar-envoy-s5:15002
const SVID_DIR = process.env.MESHY_SVID_DIR || '/svid';
const ENVOY_SPIFFE =
  process.env.MESHY_ENVOY_SPIFFE || 'spiffe://lodestar.internal/svc/envoy';
const MESHY_AUTHORITY = 'api.meshy.ai';

export function envoyInjectionEnabled(): boolean {
  return !!ENVOY_ORIGIN;
}

// Envoy presents its SPIRE server SVID (URI SAN spiffe://…/svc/envoy, no DNS
// SAN), so the default hostname check fails. `ca` still enforces the chain; we
// additionally assert the peer's SPIFFE URI is exactly Envoy's.
function checkEnvoyIdentity(_host: string, cert: PeerCertificate): Error | undefined {
  const san = cert?.subjectaltname ?? '';
  const ok = san
    .split(',')
    .map((s) => s.trim())
    .includes(`URI:${ENVOY_SPIFFE}`);
  return ok ? undefined : new Error(`unexpected Envoy server SVID SAN: ${san || '(none)'}`);
}

// A single undici Client pinned to Envoy's origin, rebuilt when the sidecar
// rotates the SVID files (tracked by svid.0.pem mtime) so a mid-run rotation
// doesn't keep using an expired client cert (DR-0014 §E.1 residual item b).
let injectClient: Client | undefined;
let svidStamp = -1;

function svidMtime(): number {
  try {
    return statSync(`${SVID_DIR}/svid.0.pem`).mtimeMs;
  } catch {
    return 0;
  }
}

function getInjectClient(): Client {
  const stamp = svidMtime();
  if (injectClient && stamp === svidStamp) return injectClient;
  const cert = readFileSync(`${SVID_DIR}/svid.0.pem`);
  const key = readFileSync(`${SVID_DIR}/svid.0.key`);
  const ca = readFileSync(`${SVID_DIR}/bundle.0.pem`);
  const previous = injectClient;
  injectClient = new Client(ENVOY_ORIGIN as string, {
    connect: {
      cert,
      key,
      ca,
      servername: MESHY_AUTHORITY,
      checkServerIdentity: checkEnvoyIdentity,
    },
  });
  svidStamp = stamp;
  // close the old pool after swap (best-effort; in-flight requests drain)
  previous?.close().catch(() => {});
  return injectClient;
}

function toHeaderRecord(init: RequestInit): Record<string, string> {
  const out: Record<string, string> = {};
  new Headers(init.headers).forEach((v, k) => {
    if (k.toLowerCase() !== 'authorization') out[k] = v; // Envoy injects auth; never send one
  });
  out.host = MESHY_AUTHORITY; // Envoy vhost match (:authority)
  return out;
}

/**
 * Like `fetch`, but for the injected `api.meshy.ai` leg: mTLS to Envoy :15002,
 * no Authorization header (Envoy injects the key server-side). Returns a normal
 * `Response`. Requires MESHY_ENVOY_ORIGIN + a readable SVID in MESHY_SVID_DIR.
 */
export async function injectedFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input.toString());
  const client = getInjectClient();
  const res = await client.request({
    method: (init.method ?? 'GET') as never,
    path: url.pathname + url.search,
    headers: toHeaderRecord(init),
    body: (init.body as string | Buffer | null | undefined) ?? undefined,
  });
  const buf = Buffer.from(await res.body.arrayBuffer());
  const headers = new Headers();
  for (const [k, v] of Object.entries(res.headers)) {
    if (v == null) continue;
    headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
  }
  return new Response(buf, { status: res.statusCode, headers });
}
