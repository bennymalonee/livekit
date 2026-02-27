# Stitch Enterprise Screens Integration

Fetch images and HTML for the 10 Stitch Enterprise Infrastructure screens and integrate them into the LivKit dashboard.

## Project

- **Stitch Project ID:** 13483321132628897886
- **Screens:** 10 (see [scripts/stitch-urls.json](../scripts/stitch-urls.json))

---

## Step 1: Get URLs from Stitch MCP

The Composer agent cannot call Stitch MCP. Run these in **Cursor Chat** (where Stitch is available):

For each screen, ask Stitch:

1. **Image:** "Get the image URL for screen `{screen-id}` in project 13483321132628897886"
2. **HTML:** "Get the HTML/code URL for screen `{screen-id}` in project 13483321132628897886"

Or in one go: "Get all images and code URLs for project 13483321132628897886"

**Screen IDs:**
- 92b42bcc02f24770b6a27a7db35cf194 (Enterprise Infrastructure Landing)
- 580f150fc10d4ce9bb1dbaf827ffcc64 (Global Stream Flow Dashboard)
- 38d7b5b584194a25bb6c7dc7fbfb28dd (Project Infrastructure Modules)
- 16551ff2cf5440498f8060a4cffae986 (Edge Infrastructure Diagnostics)
- d0ced646c1354f1599620c347b12a520 (Real-time Session Monitor)
- e777fa62d41f48e9b406886faaf125a2 (High-Fidelity Traffic Analytics)
- 385863d4f1a649a28eca8d8eeef06ab2 (Terminal Diagnostic Streamer)
- 7c0ba31c64e74896991c1cde42fcd9cf (Vault-Grade Key Management)
- 914e9fa6719a4ffebf47dfaa76700c47 (Node Initialization System)
- 3b99c4316ad946498d8442b63cb508f5 (Enterprise Infrastructure Landing alt)

Copy the hosted URLs into [scripts/stitch-urls.json](../scripts/stitch-urls.json) (`imageUrl` and `htmlUrl` for each screen).

---

## Step 2: Download Assets

**Option A – Node.js (Windows):**
```bash
cd LivKit
node scripts/download-stitch-assets.mjs
```

**Option B – Bash (Linux/Mac, requires jq):**
```bash
cd LivKit
chmod +x scripts/download-stitch-assets.sh
./scripts/download-stitch-assets.sh
```

Assets are saved to `frontend/public/stitch/images/` and `frontend/public/stitch/html/`.

---

## Step 3: Run the Dashboard

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Each route shows the Stitch HTML in an iframe.

---

## Routes

| Screen | Route |
|--------|-------|
| Enterprise Infrastructure Landing | `/` |
| Global Stream Flow Dashboard | `/dashboard` |
| Project Infrastructure Modules | `/modules` |
| Edge Infrastructure Diagnostics | `/diagnostics` |
| Real-time Session Monitor | `/sessions` |
| High-Fidelity Traffic Analytics | `/analytics` |
| Terminal Diagnostic Streamer | `/terminal` |
| Vault-Grade Key Management | `/vault` |
| Node Initialization System | `/nodes` |
| Enterprise Infrastructure Landing (alt) | `/landing-alt` |
