# LiveKit Cluster Deployment

Production-ready LiveKit deployment with Redis and Coturn.

**Repository:** https://github.com/livekit/livekit

## Prerequisites

- Ubuntu 22.04 (or similar Linux with Docker)
- Docker and Docker Compose
- Public IP or domain for TURN
- TLS certificates (Let's Encrypt) for Coturn TURN/TLS

## Quick Start

1. **Set your public IP:**
   ```bash
   export LIVEKIT_PUBLIC_IP=1.2.3.4
   ```

2. **Place TLS certs** (see `certs/README.md`):
   ```bash
   cp /etc/letsencrypt/live/turn.example.com/fullchain.pem certs/
   cp /etc/letsencrypt/live/turn.example.com/privkey.pem certs/
   ```

3. **Deploy:**
   ```bash
   cd deploy
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. **Without Coturn** (no TLS yet):
   ```bash
   sudo ./deploy.sh --skip-certs
   ```

## Output

After deployment, the script prints:

```
API Key:    livekit_xxxxxxxx
API Secret: xxxxxxxxxxxxxx
Server URL: ws://1.2.3.4:7880
```

## Verify

```bash
curl -s http://127.0.0.1:7880
docker compose -f /opt/livekit/docker-compose.yml logs -f livekit-server
```

## Structure

```
/opt/livekit/
├── docker-compose.yml      # LiveKit + Redis
├── docker-compose.coturn.yml
├── livekit.yaml            # Generated config
├── .env                    # Generated credentials
├── coturn/
│   └── turnserver.conf
└── certs/
    ├── fullchain.pem
    └── privkey.pem
```

## TLS (Not Self-Signed)

Use Let's Encrypt. See `certs/README.md`.

## Using LiveKit from your app (token generation)

If you deployed via **Coolify** (see [docs/LIVEKIT-COOLIFY-SETUP.md](../docs/LIVEKIT-COOLIFY-SETUP.md)), copy **LIVEKIT_API_KEY** and **LIVEKIT_API_SECRET** from the livekit-stack app's environment in Coolify. Set them in your backend (e.g. Convex env or server config) and use the LiveKit server SDK to create access tokens; never expose the secret to the client. The app connects to the LiveKit URL (e.g. `ws://your-vps-ip:7880` or `NEXT_PUBLIC_LIVEKIT_URL`).
