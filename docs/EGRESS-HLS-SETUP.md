# LiveKit Egress - HLS Hybrid Streaming

Enable LiveKit egress to generate HLS output for room recordings.

---

## 1. Deploy LiveKit Egress Service

```bash
cd deploy
./egress-setup.sh
```

This deploys:
- **Egress** – LiveKit egress worker (RoomComposite, TrackComposite, etc.)
- **MinIO** – S3-compatible local storage for HLS segments

---

## 2. Configure Storage (Local)

MinIO provides local S3-compatible storage:

- **Bucket:** `livekit-hls`
- **Endpoint:** `http://127.0.0.1:9000`
- **Credentials:** `minioadmin` / `minioadmin` (change in `.env`)

Data is stored in Docker volume `minio-data`.

---

## 3. Generate HLS Segments

**Edit** `egress/room-composite-hls.json` – set `room_name` to your room.

**Start egress:**

```bash
lk egress start \
  --url ws://127.0.0.1:7880 \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --type room-composite \
  egress/room-composite-hls.json
```

Or with LiveKit behind NGINX (WSS):

```bash
lk egress start \
  --url wss://live.yourdomain.com \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --type room-composite \
  egress/room-composite-hls.json
```

Output structure in MinIO:
```
livekit-hls/
└── recordings/
    └── {room_name}_{egress_id}/
        ├── playlist.m3u8      # Full playlist
        ├── live.m3u8           # Live playlist (last N segments)
        └── segment_*.ts        # HLS segments
```

---

## 4. Expose HLS via NGINX

Add to your NGINX server block (e.g. `/etc/nginx/sites-available/livekit`):

```nginx
location /hls/ {
    proxy_pass http://127.0.0.1:9000/livekit-hls/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Cache-Control "public, max-age=2";
    add_header Access-Control-Allow-Origin "*";
}
```

Reload NGINX:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Sample HLS URL

After starting egress and joining a room:

```
https://live.yourdomain.com/hls/recordings/my-room_EG_xxxxxxxx/playlist.m3u8
```

**Live playlist** (last few segments, for low-latency streaming):

```
https://live.yourdomain.com/hls/recordings/my-room_EG_xxxxxxxx/live.m3u8
```

**Test with ffplay or VLC:**

```bash
ffplay "https://live.yourdomain.com/hls/recordings/my-room_EG_xxx/live.m3u8"
```

---

## 6. CDN Integration (Later)

To serve HLS via a CDN:

### Option A: CDN in Front of NGINX

1. Point your CDN (CloudFront, Cloudflare, Fastly) origin to `https://live.yourdomain.com`
2. Cache `/hls/*` with short TTL (2–10 seconds for live)
3. Use CDN URL for playback: `https://cdn.yourdomain.com/hls/...`

### Option B: S3/GCS Origin

1. Change egress config to use AWS S3 or GCP instead of MinIO
2. Update `egress/egress.yaml.template` and `room-composite-hls.json` with S3/GCP credentials
3. Enable public read on the bucket (or signed URLs)
4. Point CDN origin to the S3/GCS bucket URL

### Option C: Sync from MinIO to CDN Origin

1. Run a sync job (e.g. `rclone`, `mc mirror`) from MinIO to S3/GCS
2. CDN origin points to S3/GCS
3. HLS files are replicated after egress writes them

### Recommended CDN Settings for HLS

| Setting | Value |
|---------|-------|
| Cache TTL (playlist) | 2–5 seconds |
| Cache TTL (segments) | 1 hour |
| CORS | Enable `Access-Control-Allow-Origin: *` |
| Range requests | Optional (for seeking) |

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Egress not starting | `docker compose logs egress` |
| Chrome failed | Ensure `--cap-add SYS_ADMIN` in container |
| MinIO connection | `curl http://127.0.0.1:9000/minio/health/live` |
| 404 on HLS | Verify bucket `livekit-hls` exists, `mc anonymous set download` |
| Playlist empty | Ensure room has participants and egress has started |
