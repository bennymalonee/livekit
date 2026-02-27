# TLS Certificates for Coturn

**TLS ready (not self-signed):** Use Let's Encrypt certificates.

## Setup with Certbot

1. Install certbot:
   ```bash
   sudo apt install certbot
   ```

2. Obtain certificates for your TURN domain (e.g. `turn.example.com`):
   ```bash
   sudo certbot certonly --standalone -d turn.example.com
   ```

3. Copy certs to this directory:
   ```bash
   sudo cp /etc/letsencrypt/live/turn.example.com/fullchain.pem ./fullchain.pem
   sudo cp /etc/letsencrypt/live/turn.example.com/privkey.pem ./privkey.pem
   sudo chmod 644 fullchain.pem
   sudo chmod 600 privkey.pem
   ```

4. Or symlink (recommended for auto-renewal):
   ```bash
   sudo ln -sf /etc/letsencrypt/live/turn.example.com/fullchain.pem ./fullchain.pem
   sudo ln -sf /etc/letsencrypt/live/turn.example.com/privkey.pem ./privkey.pem
   ```

## Required files

- `fullchain.pem` - Certificate chain
- `privkey.pem` - Private key

Coturn will not start without these. Run `deploy.sh` after placing certs.
