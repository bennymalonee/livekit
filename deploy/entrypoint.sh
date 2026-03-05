#!/bin/sh
# Expand env vars in LiveKit config template and start the server.
# Required in container: REDIS_PASSWORD, TURN_HOST, TURN_CREDENTIAL,
#   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_REGION, LIVEKIT_WEBHOOK_URL
set -e

# Required env vars (fail fast with clear error for Coolify logs)
REQUIRED="REDIS_PASSWORD TURN_HOST TURN_CREDENTIAL LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_REGION LIVEKIT_WEBHOOK_URL"
for var in $REQUIRED; do
  eval "val=\$$var"
  if [ -z "$val" ]; then
    echo "ERROR: Required env var $var is not set. Set it in Coolify → livekit-stack → Environment variables." >&2
    exit 1
  fi
done

TEMPLATE="${LIVEKIT_CONFIG_TEMPLATE:-/etc/livekit/livekit.yaml.template}"
OUTPUT="${LIVEKIT_CONFIG_OUTPUT:-/etc/livekit/livekit.yaml}"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: Config template not found: $TEMPLATE" >&2
  exit 1
fi

# Substitute only our known vars so values containing $ are safe
export REDIS_PASSWORD TURN_HOST TURN_CREDENTIAL LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_REGION LIVEKIT_WEBHOOK_URL LIVEKIT_PUBLIC_IP
envsubst '$REDIS_PASSWORD $TURN_HOST $TURN_CREDENTIAL $LIVEKIT_API_KEY $LIVEKIT_API_SECRET $LIVEKIT_REGION $LIVEKIT_WEBHOOK_URL $LIVEKIT_PUBLIC_IP' < "$TEMPLATE" > "$OUTPUT"

# Ensure no unsubstituted placeholders remain (would break LiveKit)
if grep -q '\${' "$OUTPUT" 2>/dev/null; then
  echo "ERROR: Config still contains unsubstituted placeholders. Check env vars in Coolify." >&2
  grep -n '\${' "$OUTPUT" >&2
  exit 1
fi

# Brief wait for Redis (host network: 127.0.0.1:6379) in case depends_on race
for i in 1 2 3 4 5 6 7 8 9 10; do
  if nc -z 127.0.0.1 6379 2>/dev/null; then
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "ERROR: Redis not reachable at 127.0.0.1:6379 after 10 attempts." >&2
    exit 1
  fi
  sleep 1
done

exec livekit-server --config "$OUTPUT" "$@"
