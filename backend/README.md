# PathologyAI Tile Server (FastAPI)

Serves whole-slide images (`.svs`, `.tiff`, `.ndpi`, `.mrxs`) to the OpenSeadragon
viewer via the DeepZoom (DZI) protocol, plus slide metadata.

## Setup (conda — recommended, bundles the native OpenSlide lib)

```bash
conda create -y -n pathology-be -c conda-forge python=3.11 openslide-python fastapi uvicorn-standard pillow
conda activate pathology-be
```

## Run

```bash
cd backend
conda activate pathology-be
uvicorn main:app --reload --port 8000
```

Slides are discovered from `SLIDES_DIR` (default: the repo root). Drop `.svs`
files there, or point elsewhere:

```bash
SLIDES_DIR=/path/to/slides uvicorn main:app --port 8000
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness + configured slides dir |
| GET | `/api/slides` | list slides (id, name, dims, mpp, magnification) |
| GET | `/api/slides/{id}/info` | one slide's metadata + DZI url |
| GET | `/api/slides/{id}.dzi` | DeepZoom descriptor (feed to OpenSeadragon) |
| GET | `/api/slides/{id}_files/{level}/{col}_{row}.jpeg` | a tile |
| GET | `/api/slides/{id}/thumbnail` | 512px thumbnail |

The frontend auto-detects this server (see `lib/config.ts` / `NEXT_PUBLIC_TILE_API`,
default `http://localhost:8000`). When it's up, the viewer shows the real slide;
when it's down, it falls back to the synthetic demo slide.
