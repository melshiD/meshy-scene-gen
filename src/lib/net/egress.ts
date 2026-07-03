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
import { ProxyAgent } from 'undici';

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
