#!/usr/bin/env bash
# Point the Vercel frontend at either the Railway (primary) or Render (standby) API
# and redeploy. Run from the repo root. Requires `vercel` CLI, either already logged
# in or with VERCEL_TOKEN exported.
#
# Usage: ./scripts/failover-api.sh railway|render

set -euo pipefail

RAILWAY_API_URL="https://sacredvibes-production.up.railway.app"
# TODO: fill in once the Render standby (render.yaml) has actually been deployed —
# Render assigns this at deploy time based on the service name in render.yaml.
RENDER_API_URL="https://sacredvibes-api.onrender.com"

target="${1:-}"
case "$target" in
  railway) new_url="$RAILWAY_API_URL" ;;
  render)  new_url="$RENDER_API_URL" ;;
  *)
    echo "Usage: $0 railway|render" >&2
    exit 1
    ;;
esac

vercel_args=()
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  vercel_args+=(--token "$VERCEL_TOKEN")
fi

cd "$(dirname "$0")/../frontend"

echo "Switching sacred-vibes frontend to $target: $new_url"

vercel env rm NEXT_PUBLIC_API_URL production --yes "${vercel_args[@]}" 2>/dev/null || true
echo "$new_url" | vercel env add NEXT_PUBLIC_API_URL production "${vercel_args[@]}"

echo "Triggering a production redeploy (NEXT_PUBLIC_* vars are inlined at build time)..."
vercel deploy --prod "${vercel_args[@]}"

echo "Done. Verify the site is actually serving against $target before considering this complete."
