#!/bin/bash
# Setup LiveKit Egress for HLS output
# Run from deploy directory. Requires .env from main deploy.

set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Run deploy.sh first."
  exit 1
fi

source .env

# Generate egress config
echo "Generating egress config..."
mkdir -p egress
sed -e "s|API_KEY|$LIVEKIT_API_KEY|g" \
    -e "s|API_SECRET|$LIVEKIT_API_SECRET|g" \
    -e "s|WS_URL|ws://127.0.0.1:7880|g" \
    -e "s|REDIS_PASSWORD|$REDIS_PASSWORD|g" \
    -e "s|MINIO_USER|${MINIO_ROOT_USER:-minioadmin}|g" \
    -e "s|MINIO_PASS|${MINIO_ROOT_PASSWORD:-minioadmin}|g" \
    egress/egress.yaml.template > egress/egress.yaml

echo "Starting services (LiveKit, Redis, MinIO, Egress)..."
docker compose -f docker-compose.yml -f docker-compose.egress.yml up -d

# If LiveKit is already running, use: docker compose -f docker-compose.yml -f docker-compose.egress.yml up -d minio minio-init egress

echo ""
echo "Egress deployed. Wait ~10s for MinIO init, then start HLS egress:"
echo "  lk egress start --url ws://127.0.0.1:7880 --api-key $LIVEKIT_API_KEY --api-secret $LIVEKIT_API_SECRET --type room-composite egress/room-composite-hls.json"
echo ""
echo "Update room_name in egress/room-composite-hls.json before running."
echo ""
