# Deploying PathologyAI (lab / local)

The whole app (frontend + tile server) runs with **one command** via Docker
Compose. The browser only ever talks to the frontend, which proxies `/api` to
the tile server — so the **same build works on `localhost` and on a lab-server
IP** with no rebuild and no CORS setup.

## Prerequisites
- Docker + Docker Compose (Docker Desktop, or Docker Engine on a Linux server).

## 1. Add slides
Put whole-slide files in the `slides/` folder (git-ignored):
```
slides/
  TCGA-99-8033-01A-01-TS1.svs
  ...
```
Users can also upload slides from the dashboard once it's running.

## 2. Start
```bash
docker compose up -d --build
```
First build takes a few minutes (installs OpenSlide + builds the Next app).

## 3. Open
- **Same machine:** http://localhost:3000
- **Anyone on the lab network:** http://<SERVER-LAN-IP>:3000
  (find the IP with `ipconfig getifaddr en0` on macOS, or `hostname -I` on Linux)

That's it — no `NEXT_PUBLIC_TILE_API`, no CORS, no per-machine config.

## Manage
```bash
docker compose logs -f          # watch logs
docker compose down             # stop
docker compose up -d --build    # rebuild after code changes
```

## Run locally without Docker (dev)
```bash
# backend
conda activate pathology-be
cd backend && SLIDES_DIR=../slides uvicorn main:app --reload --port 8000
# frontend (another terminal)
npm install && npm run dev
```
Next proxies `/api` → `http://localhost:8000` automatically (see `next.config.ts`).

## Notes
- **Keep it on the lab network.** No auth/HTTPS is configured, so don't expose
  port 3000 to the public internet. For remote access, put it behind a VPN or a
  reverse proxy with auth + TLS.
- Slides live in `./slides` on the host (mounted into the backend), so they
  persist across restarts and aren't baked into the image.
- GPU isn't needed for the tile server; it will be for the real analysis models.
