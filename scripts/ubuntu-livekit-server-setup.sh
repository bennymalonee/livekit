#!/bin/bash
# =============================================================================
# Production-Ready Ubuntu 22.04 Server Setup for LiveKit Deployment
# =============================================================================
# Run as root or with sudo. Tested on Ubuntu 22.04 LTS.
# Usage: sudo bash ubuntu-livekit-server-setup.sh
# =============================================================================

set -e  # Exit on any error

echo "=== LiveKit Server Setup - Ubuntu 22.04 ==="

# -----------------------------------------------------------------------------
# 1. Update and upgrade system packages
# -----------------------------------------------------------------------------
echo ""
echo "[1/10] Updating and upgrading system packages..."

apt-get update
# -y: non-interactive, assume yes
apt-get upgrade -y

echo "System packages updated successfully."

# -----------------------------------------------------------------------------
# 2. Install Docker and Docker Compose (latest stable)
# -----------------------------------------------------------------------------
echo ""
echo "[2/10] Installing Docker and Docker Compose..."

# Remove old Docker versions if present
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Docker and Docker Compose installed successfully."

# -----------------------------------------------------------------------------
# 3. Configure Docker to start on boot
# -----------------------------------------------------------------------------
echo ""
echo "[3/10] Configuring Docker to start on boot..."

systemctl enable docker.service
systemctl enable containerd.service

echo "Docker will start automatically on boot."

# -----------------------------------------------------------------------------
# 4. Enable firewall (UFW)
# -----------------------------------------------------------------------------
echo ""
echo "[4/10] Enabling UFW firewall..."

apt-get install -y ufw
# ufw --force reset  # Uncomment only on fresh installs - wipes existing rules!
ufw default deny incoming
ufw default allow outgoing

echo "Firewall defaults configured."

# -----------------------------------------------------------------------------
# 5. Open required ports
# -----------------------------------------------------------------------------
echo ""
echo "[5/10] Opening required ports..."

ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 7880/tcp comment 'LiveKit HTTP'
ufw allow 7881/tcp comment 'LiveKit TCP'
ufw allow 50000:60000/udp comment 'WebRTC RTP'

ufw --force enable

echo "Firewall enabled with required ports open."

# -----------------------------------------------------------------------------
# 6. Increase system limits
# -----------------------------------------------------------------------------
echo ""
echo "[6/10] Increasing system limits..."

cat > /etc/sysctl.d/99-livekit.conf << 'EOF'
# LiveKit production tuning - system limits
fs.file-max = 2097152
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.netdev_max_backlog = 250000

# WebRTC UDP buffer optimization
net.ipv4.udp_mem = 65536 131072 262144
net.ipv4.udp_rmem_min = 65536
net.ipv4.udp_wmem_min = 65536
net.core.rmem_default = 262144
net.core.wmem_default = 262144
EOF

sysctl -p /etc/sysctl.d/99-livekit.conf

echo "System limits increased."

# -----------------------------------------------------------------------------
# 7. Optimize UDP buffer settings for WebRTC
# -----------------------------------------------------------------------------
echo ""
echo "[7/10] UDP buffer settings applied (included in sysctl config above)."

# -----------------------------------------------------------------------------
# 8. Install fail2ban
# -----------------------------------------------------------------------------
echo ""
echo "[8/10] Installing fail2ban..."

apt-get install -y fail2ban

# Create local jail config for SSH
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

echo "fail2ban installed and configured."

# -----------------------------------------------------------------------------
# 9. Install htop and curl for monitoring
# -----------------------------------------------------------------------------
echo ""
echo "[9/10] Installing htop and curl..."

apt-get install -y htop curl

echo "Monitoring tools installed."

# -----------------------------------------------------------------------------
# 10. Verify Docker installation
# -----------------------------------------------------------------------------
echo ""
echo "[10/10] Verifying Docker installation..."

docker --version
docker compose version

# Quick sanity check
docker run --rm hello-world

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Summary:"
echo "  - System updated and upgraded"
echo "  - Docker + Docker Compose installed"
echo "  - Docker enabled on boot"
echo "  - UFW firewall enabled (ports 22, 80, 443, 7880, 7881, 50000-60000/udp)"
echo "  - System limits and UDP buffers tuned for LiveKit"
echo "  - fail2ban installed (SSH protection)"
echo "  - htop, curl installed"
echo ""
echo "Next steps:"
echo "  1. Deploy LiveKit using your preferred method (Docker Compose, etc.)"
echo "  2. Configure SSL/TLS for HTTPS (e.g., certbot + Let's Encrypt)"
echo "  3. Review fail2ban status: fail2ban-client status"
echo ""
