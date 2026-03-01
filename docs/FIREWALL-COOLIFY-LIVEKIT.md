# Firewall: Coolify + LiveKit Stack

Open these ports on the **host** (VPS or machine where Coolify runs). Prefer your **cloud provider’s firewall** (e.g. Hetzner, DigitalOcean, AWS Security Groups). Coolify runs in Docker; Linux UFW can be bypassed by Docker’s iptables, so cloud firewall rules are more reliable.

---

## Coolify (dashboard + proxy)

| Port | Protocol | Purpose |
|------|----------|---------|
| **443** | TCP | HTTPS (Traefik/Caddy) |
| **80** | TCP | HTTP, SSL issuance |
| **22** | TCP | SSH |
| **8000** | TCP | Coolify dashboard (if using IP:8000) |
| **6001** | TCP | Real-time (Coolify 4.x) |
| **6002** | TCP | Terminal (Coolify 4.x) |

If you use a **custom domain** for Coolify and access it via 443/80 only, you can leave 8000, 6001, 6002 closed after first setup.

---

## LiveKit stack (same server)

Used when the LiveKit stack app runs on the **same** server as Coolify (e.g. `network_mode: host`).

| Port | Protocol | Purpose |
|------|----------|---------|
| **7880** | TCP | LiveKit API / WebSocket (client connections) |
| **7881** | TCP | ICE/TCP fallback (e.g. VPN/corporate) |
| **50000–60000** | **UDP** | WebRTC media (ICE host candidates) |

If TURN is on the **same host** (e.g. Coturn in the same VPS):

| Port | Protocol | Purpose |
|------|----------|---------|
| **3478** | UDP | TURN/STUN |
| **5349** | TCP | TURN over TLS |

If TURN is on another host, open only 7880, 7881, and 50000–60000/UDP on the LiveKit server.

---

## Checklist (one server: Coolify + LiveKit)

- [ ] **Cloud firewall** (preferred): In your provider’s dashboard, allow **inbound**:
  - TCP: 22, 80, 443, 7880, 7881, 5349 (and 8000, 6001, 6002 if needed)
  - UDP: 3478, 50000–60000
- [ ] **Redis** is bound to `127.0.0.1:6379` in the stack; no need to open 6379 publicly.
- [ ] After changing firewall, test: `curl -s -o /dev/null -w "%{http_code}" http://YOUR_SERVER_IP:7880` (expect 200, 404, or 405).

---

## Optional: UFW on the server

If your provider has no firewall and you rely on UFW, run on the server (SSH as root or with sudo):

```bash
# Coolify
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 8000/tcp comment 'Coolify dashboard'
ufw allow 6001/tcp comment 'Coolify real-time'
ufw allow 6002/tcp comment 'Coolify terminal'

# LiveKit stack
ufw allow 7880/tcp comment 'LiveKit API/WebSocket'
ufw allow 7881/tcp comment 'LiveKit ICE TCP'
ufw allow 50000:60000/udp comment 'LiveKit WebRTC UDP'

# TURN (only if TURN runs on this host)
ufw allow 3478/udp comment 'TURN/STUN'
ufw allow 5349/tcp comment 'TURN TLS'

ufw enable
ufw status numbered
```

**Note:** Docker can bypass UFW. For production, prefer the cloud provider’s firewall. If you need UFW to fully control access, consider [ufw-docker](https://github.com/chaifeng/ufw-docker) (see [Coolify firewall docs](https://coolify.io/docs/knowledge-base/server/firewall)).

---

## References

- [LiveKit: Ports and firewall](https://docs.livekit.io/transport/self-hosting/ports-firewall/)
- [Coolify: Firewall](https://coolify.io/docs/knowledge-base/server/firewall)
- This repo: `scripts/ubuntu-livekit-server-setup.sh` (includes UFW rules for LiveKit)
