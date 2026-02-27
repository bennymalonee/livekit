# Secure LiveKit with NGINX and Let's Encrypt

Production setup for LiveKit behind NGINX with WSS (WebSocket Secure).

---

## Quick Setup (Automated)

```bash
sudo ./livekit-nginx-ssl-setup.sh live.yourdomain.com
```

**Prerequisites:** DNS for `live.yourdomain.com` must point to your server. LiveKit must be running on port 7880.

---

## Manual Steps

### 1. Install NGINX

```bash
sudo apt update
sudo apt install -y nginx
```

### 2. Configure Reverse Proxy

Create `/etc/nginx/sites-available/livekit`:

```nginx
upstream livekit_backend {
    server 127.0.0.1:7880;
    keepalive 64;
}

server {
    listen 80;
    server_name live.yourdomain.com;

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
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/livekit /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3. WebSocket Support

The config above includes required headers:

- `Upgrade $http_upgrade` – WebSocket upgrade
- `Connection "upgrade"` – Connection upgrade
- `proxy_read_timeout 86400` – Long-lived WebSocket connections

### 4. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5. Generate SSL Certificate

```bash
sudo certbot --nginx -d live.yourdomain.com
```

Certbot will obtain the certificate and update NGINX for HTTPS.

### 6. Force HTTPS

Certbot adds an HTTP→HTTPS redirect. If configuring manually:

```nginx
server {
    listen 80;
    server_name live.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 7. Enable Auto-Renewal

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Verify:

```bash
sudo systemctl status certbot.timer
```

Certbot runs twice daily and renews certificates before expiry.

### 8. Test WebRTC over WSS

**Server URL:** `wss://live.yourdomain.com`

```bash
# Quick connectivity test
curl -sI https://live.yourdomain.com
```

**Client test (e.g. LiveKit Meet):**

1. Open https://meet.livekit.io
2. Enter server URL: `wss://live.yourdomain.com`
3. Generate token with your API key/secret
4. Join a room and verify audio/video

---

## Firewall

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| 502 Bad Gateway | LiveKit running? `curl http://127.0.0.1:7880` |
| WebSocket fails | NGINX `Upgrade` and `Connection` headers set? |
| Certificate error | `sudo certbot certificates` |
| Renewal fails | `sudo certbot renew --dry-run` |
