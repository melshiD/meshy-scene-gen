#!/bin/sh
# SVID file-drop sidecar loop (KeyMaster S5, DR-0014 §E). Fetches meshy's X.509-SVID from the SPIRE agent's
# Workload API socket and writes svid.0.pem / svid.0.key / bundle.0.pem into $OUT (a volume shared read-only
# with the meshy app). Refreshes well within the SVID TTL (3600s) so the app always has a valid client cert;
# the app watches the file mtime and rebuilds its mTLS client on rotation (see src/lib/net/egress.ts).
set -u
SOCK="${SPIRE_SOCK:-/run/spire/sockets/agent.sock}"
OUT="${SVID_OUT:-/svid}"
REFRESH="${SVID_REFRESH_SECONDS:-900}"   # < TTL/2; fetch is one-shot so we re-fetch on a timer

first=1
while true; do
  if spire-agent api fetch x509 -socketPath "$SOCK" -write "$OUT" -timeout 10s >/dev/null 2>&1; then
    if [ "$first" = 1 ]; then echo "svid-sidecar: SVID written to $OUT"; first=0; fi
    sleep "$REFRESH"
  else
    # agent not ready / socket missing on first boot — retry quickly until the first success.
    echo "svid-sidecar: fetch failed (agent not ready?) — retrying in 5s"
    sleep 5
  fi
done
