# LiveKit Server Setup - Ubuntu 22.04 Reference

Production-ready commands for deploying LiveKit on Ubuntu 22.04. Run as `root` or with `sudo`.

---

## 1. Update and Upgrade System Packages

```bash
apt-get update
apt-get upgrade -y
```

| Command | Explanation |
|---------|-------------|
| `apt-get update` | Refreshes package index from repositories |
| `apt-get upgrade -y` | Upgrades all installed packages; `-y` auto-confirms |

---

## 2. Install Docker and Docker Compose (Latest Stable)

```bash
# Remove old Docker versions (if any)
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Prerequisites
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

| Component | Purpose |
|-----------|---------|
| `docker-ce` | Docker Engine (Community Edition) |
| `docker-compose-plugin` | Docker Compose v2 (native plugin) |
| `containerd.io` | Container runtime |

---

## 3. Configure Docker to Start on Boot

```bash
systemctl enable docker.service
systemctl enable containerd.service
```

Ensures Docker and containerd start automatically after reboot.

---

## 4. Enable Firewall (UFW)

```bash
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
```

| Setting | Effect |
|---------|--------|
| `deny incoming` | Block all inbound by default |
| `allow outgoing` | Allow all outbound traffic |

---

## 5. Open Required Ports

```bash
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 7880/tcp comment 'LiveKit HTTP'
ufw allow 7881/tcp comment 'LiveKit TCP'
ufw allow 50000:60000/udp comment 'WebRTC RTP'

ufw --force enable
```

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (redirect to HTTPS) |
| 443 | TCP | HTTPS |
| 7880 | TCP | LiveKit HTTP API |
| 7881 | TCP | LiveKit TCP (TURN) |
| 50000-60000 | UDP | WebRTC RTP media |

---

## 6. Increase System Limits

```bash
cat > /etc/sysctl.d/99-livekit.conf << 'EOF'
fs.file-max = 2097152
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.netdev_max_backlog = 250000
EOF

sysctl -p /etc/sysctl.d/99-livekit.conf
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `fs.file-max` | 2,097,152 | Max open file descriptors |
| `net.core.rmem_max` | 128 MB | Max receive buffer |
| `net.core.wmem_max` | 128 MB | Max send buffer |
| `net.core.netdev_max_backlog` | 250,000 | Packet queue size |

---

## 7. Optimize UDP Buffers for WebRTC

```bash
cat >> /etc/sysctl.d/99-livekit.conf << 'EOF'

net.ipv4.udp_mem = 65536 131072 262144
net.ipv4.udp_rmem_min = 65536
net.ipv4.udp_wmem_min = 65536
net.core.rmem_default = 262144
net.core.wmem_default = 262144
EOF

sysctl -p /etc/sysctl.d/99-livekit.conf
```

| Parameter | Purpose |
|-----------|---------|
| `udp_mem` | Min/pressure/max UDP buffer pages |
| `udp_rmem_min` / `udp_wmem_min` | Min UDP buffer sizes |
| `rmem_default` / `wmem_default` | Default socket buffer sizes |

---

## 8. Install fail2ban

```bash
apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

| Setting | Value | Meaning |
|---------|-------|---------|
| `bantime` | 1h | Ban duration |
| `findtime` | 10m | Time window for counting failures |
| `maxretry` | 3 (SSH) | Failed attempts before ban |

---

## 9. Install Monitoring Tools

```bash
apt-get install -y htop curl
```

| Tool | Use |
|------|-----|
| `htop` | Interactive process viewer |
| `curl` | HTTP client, health checks |

---

## 10. Verify Docker Installation

```bash
docker --version
docker compose version
docker run --rm hello-world
```

Expected: Docker and Compose version strings, plus "Hello from Docker!" output.

---

## One-Liner (Run Full Script)

```bash
sudo bash ubuntu-livekit-server-setup.sh
```

---

## Post-Setup Checklist

- [ ] Configure SSL (e.g. `certbot` + Let's Encrypt)
- [ ] Deploy LiveKit via Docker Compose
- [ ] Check `fail2ban-client status`
- [ ] Test WebRTC connectivity on ports 50000-60000/UDP
