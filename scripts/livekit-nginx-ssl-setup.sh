#!/bin/bash
# =============================================================================
# Secure LiveKit with NGINX and Let's Encrypt
# =============================================================================
# Run as root or with sudo on Ubuntu 22.04
# Usage: sudo ./livekit-nginx-ssl-setup.sh live.yourdomain.com
# =============================================================================

set -e

DOMAIN="${1:?Usage: $0 live.yourdomain.com}"

echo "=== LiveKit NGINX + Let's Encrypt Setup ==="
echo "Domain: $DOMAIN"
echo ""

# Prerequisite: LiveKit should be running on 7880
if ! curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:7880 2>/dev/null | grep -qE "200|404|101"; then
  echo "WARNING: LiveKit does not appear to be running on port 7880."
  echo "Start LiveKit before testing WSS. Continuing with NGINX setup..."
fi

# -----------------------------------------------------------------------------
# 1. Install NGINX
# -----------------------------------------------------------------------------
echo "[1/8] Installing NGINX..."
apt-get update
apt-get install -y nginx

# -----------------------------------------------------------------------------
# 2. Configure reverse proxy (HTTP first, for certbot challenge)
# -----------------------------------------------------------------------------
echo "[2/8] Configuring NGINX reverse proxy..."

cat > /etc/nginx/sites-available/livekit << 'NGINX_HTTP'
# LiveKit reverse proxy - HTTP (certbot will add HTTPS)
# Replace DOMAIN_PLACEHOLDER with your domain

upstream livekit_backend {
    server 127.0.0.1:7880;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    # WebSocket support
    location / {
        proxy_pass http://livekit_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX_HTTP

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/livekit

# Enable site, disable default
ln -sf /etc/nginx/sites-available/livekit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx

echo "NGINX configured for $DOMAIN → localhost:7880"

# -----------------------------------------------------------------------------
# 3. WebSocket support (already in config above)
# -----------------------------------------------------------------------------
echo "[3/8] WebSocket support enabled (Upgrade, Connection headers)"

# -----------------------------------------------------------------------------
# 4. Install certbot
# -----------------------------------------------------------------------------
echo "[4/8] Installing certbot..."
apt-get install -y certbot python3-certbot-nginx

# -----------------------------------------------------------------------------
# 5. Generate SSL certificate
# -----------------------------------------------------------------------------
echo "[5/8] Generating Let's Encrypt certificate..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

# Certbot modifies the NGINX config. Re-apply full config with WebSocket on HTTPS.
echo "[6/8] Applying HTTPS config with WebSocket..."

cat > /etc/nginx/sites-available/livekit << 'NGINX_HTTPS'
# LiveKit reverse proxy - HTTPS with WebSocket
# DOMAIN_PLACEHOLDER replaced by script

upstream livekit_backend {
    server 127.0.0.1:7880;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://livekit_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX_HTTPS

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/livekit

nginx -t && systemctl reload nginx

# -----------------------------------------------------------------------------
# 7. Enable auto-renew
# -----------------------------------------------------------------------------
echo "[7/8] Enabling certbot auto-renew..."
systemctl enable certbot.timer
systemctl start certbot.timer

# -----------------------------------------------------------------------------
# 8. Test
# -----------------------------------------------------------------------------
echo "[8/8] Testing..."
sleep 2
if curl -sI "https://$DOMAIN" | head -1 | grep -q "200\|101\|301\|302"; then
  echo "HTTPS reachable: https://$DOMAIN"
else
  echo "Check manually: curl -sI https://$DOMAIN"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "LiveKit URL (WSS): wss://$DOMAIN"
echo "Force HTTPS:      Enabled (HTTP redirects to HTTPS)"
echo "Auto-renew:       certbot.timer (runs twice daily)"
echo ""
echo "Test WebRTC: Use wss://$DOMAIN as server URL in your LiveKit client."
echo ""
