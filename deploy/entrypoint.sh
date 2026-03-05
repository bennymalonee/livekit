#!/bin/sh
# Expand env vars in LiveKit config template and start the server.
# Required: REDIS_PASSWORD, TURN_HOST, TURN_CREDENTIAL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_REGION, LIVEKIT_WEBHOOK_URL
# Optional: REDIS_ADDRESS (default 127.0.0.1:6379), LIVEKIT_PUBLIC_IP
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

REDIS_ADDRESS="${REDIS_ADDRESS:-127.0.0.1:6379}"
OUTPUT="${LIVEKIT_CONFIG_OUTPUT:-/etc/livekit/livekit.yaml}"
TEMPLATE_FILE="${LIVEKIT_CONFIG_TEMPLATE:-/etc/livekit/livekit.yaml.template}"
TEMPLATE_TMP="/tmp/livekit.yaml.template.$$"

# Use mounted/copied template if present; otherwise use embedded template
if [ -f "$TEMPLATE_FILE" ]; then
  cp "$TEMPLATE_FILE" "$TEMPLATE_TMP"
else
  cat > "$TEMPLATE_TMP" << 'TEMPLATE_EOF'
port: 7880

redis:
  address: ${REDIS_ADDRESS}
  password: ${REDIS_PASSWORD}
  db: 0

rtc:
  port_range_start: 50000
  port_range_end: 50100
  tcp_port: 7881
  use_external_ip: true
  turn_servers:
    - host: ${TURN_HOST}
      port: 3478
      protocol: udp
      username: livekit
      credential: ${TURN_CREDENTIAL}
    - host: ${TURN_HOST}
      port: 5349
      protocol: tls
      username: livekit
      credential: ${TURN_CREDENTIAL}

keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}

region: ${LIVEKIT_REGION}

webhook:
  api_key: ${LIVEKIT_API_KEY}
  urls:
    - ${LIVEKIT_WEBHOOK_URL}

logging:
  level: info
  pion_level: error
TEMPLATE_EOF
fi

# Substitute only our known vars so values containing $ are safe
export REDIS_ADDRESS REDIS_PASSWORD TURN_HOST TURN_CREDENTIAL LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_REGION LIVEKIT_WEBHOOK_URL LIVEKIT_PUBLIC_IP
envsubst '$REDIS_ADDRESS $REDIS_PASSWORD $TURN_HOST $TURN_CREDENTIAL $LIVEKIT_API_KEY $LIVEKIT_API_SECRET $LIVEKIT_REGION $LIVEKIT_WEBHOOK_URL $LIVEKIT_PUBLIC_IP' < "$TEMPLATE_TMP" > "$OUTPUT"
rm -f "$TEMPLATE_TMP"

# Ensure no unsubstituted placeholders remain (would break LiveKit)
if grep -q '\${' "$OUTPUT" 2>/dev/null; then
  echo "ERROR: Config still contains unsubstituted placeholders. Check env vars in Coolify." >&2
  grep -n '\${' "$OUTPUT" >&2
  exit 1
fi

# Wait for Redis at REDIS_ADDRESS (e.g. redis:6379 or 127.0.0.1:6379)
redis_host="${REDIS_ADDRESS%:*}"
redis_port="${REDIS_ADDRESS#*:}"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if nc -z "$redis_host" "$redis_port" 2>/dev/null; then
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "ERROR: Redis not reachable at $REDIS_ADDRESS after 10 attempts." >&2
    exit 1
  fi
  sleep 1
done

exec livekit-server --config "$OUTPUT" "$@"
