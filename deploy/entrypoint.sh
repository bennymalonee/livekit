#!/bin/sh
# Expand env vars in LiveKit config template and start the server.
# Required in container: REDIS_PASSWORD, TURN_HOST, TURN_CREDENTIAL,
#   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_REGION, LIVEKIT_WEBHOOK_URL
# Template: use LIVEKIT_CONFIG_TEMPLATE path if set and file exists; else use embedded template.
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

OUTPUT="${LIVEKIT_CONFIG_OUTPUT:-/etc/livekit/livekit.yaml}"
TEMPLATE_FILE="${LIVEKIT_CONFIG_TEMPLATE:-/etc/livekit/livekit.yaml.template}"
TEMPLATE_TMP="/tmp/livekit.yaml.template.$$"

# Use mounted/copied template if present; otherwise use embedded template (works even when Coolify doesn't provide the file)
if [ -f "$TEMPLATE_FILE" ]; then
  cp "$TEMPLATE_FILE" "$TEMPLATE_TMP"
else
  cat > "$TEMPLATE_TMP" << 'TEMPLATE_EOF'
port: 7880

redis:
  address: 127.0.0.1:6379
  password: ${REDIS_PASSWORD}
  db: 0

rtc:
  port_range_start: 50000
  port_range_end: 60000
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
export REDIS_PASSWORD TURN_HOST TURN_CREDENTIAL LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_REGION LIVEKIT_WEBHOOK_URL LIVEKIT_PUBLIC_IP
envsubst '$REDIS_PASSWORD $TURN_HOST $TURN_CREDENTIAL $LIVEKIT_API_KEY $LIVEKIT_API_SECRET $LIVEKIT_REGION $LIVEKIT_WEBHOOK_URL $LIVEKIT_PUBLIC_IP' < "$TEMPLATE_TMP" > "$OUTPUT"
rm -f "$TEMPLATE_TMP"

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
