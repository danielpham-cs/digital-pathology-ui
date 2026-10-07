"""
PathologyAI tile server — serves whole-slide images (.svs/.tiff/.ndpi) to the
OpenSeadragon viewer via the DeepZoom (DZI) protocol.

Run:
    conda activate pathology-be
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import io
import os
from functools import lru_cache
from pathlib import Path

import openslide
from openslide import OpenSlide
from openslide.deepzoom import DeepZoomGenerator
from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# --- config -----------------------------------------------------------------

# Directory to scan for slides. Defaults to <repo>/slides.
SLIDES_DIR = Path(os.environ.get("SLIDES_DIR", Path(__file__).resolve().parent.parent / "slides"))
WSI_EXTS = {".svs", ".tiff", ".tif", ".ndpi", ".mrxs"}
TILE_SIZE = 254
OVERLAP = 1
TILE_FORMAT = "jpeg"
TILE_QUALITY = 80

app = FastAPI(title="PathologyAI Tile Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# --- slide registry ---------------------------------------------------------

def scan_slides() -> dict[str, Path]:
    """Map a clean slide id -> file path. id = filename up to the first dot."""
    registry: dict[str, Path] = {}
    if not SLIDES_DIR.exists():
        return registry
    for path in sorted(SLIDES_DIR.iterdir()):
        if path.suffix.lower() in WSI_EXTS:
            sid = path.name.split(".")[0]
            # de-dupe on collision
            base, n = sid, 1
            while sid in registry:
                n += 1
                sid = f"{base}-{n}"
            registry[sid] = path
    return registry


def resolve(slide_id: str) -> Path:
    path = scan_slides().get(slide_id)
    if path is None:
        raise HTTPException(status_code=404, detail=f"slide '{slide_id}' not found")
    return path


@lru_cache(maxsize=8)
def get_dz(slide_id: str) -> tuple[OpenSlide, DeepZoomGenerator]:
    """Open a slide + its DeepZoom generator, cached (opening is expensive)."""
    path = resolve(slide_id)
    slide = OpenSlide(str(path))
    dz = DeepZoomGenerator(slide, tile_size=TILE_SIZE, overlap=OVERLAP, limit_bounds=True)
    return slide, dz


# --- endpoints --------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "slides_dir": str(SLIDES_DIR)}


@app.get("/api/slides")
def list_slides():
    out = []
    for sid, path in scan_slides().items():
        try:
            slide = OpenSlide(str(path))
            props = slide.properties
            out.append({
                "id": sid,
                "name": path.name,
                "sizeMB": round(path.stat().st_size / (1024 * 1024)),
                "width": slide.dimensions[0],
                "height": slide.dimensions[1],
                "mpp": float(props.get(openslide.PROPERTY_NAME_MPP_X) or 0) or None,
                "magnification": props.get(openslide.PROPERTY_NAME_OBJECTIVE_POWER),
                "vendor": props.get(openslide.PROPERTY_NAME_VENDOR),
            })
            slide.close()
        except Exception as exc:  # pragma: no cover - surface bad files
            out.append({"id": sid, "name": path.name, "error": str(exc)})
    return {"slides": out}


@app.post("/api/slides")
async def upload_slide(file: UploadFile = File(...)):
    """Store an uploaded WSI on disk and return its metadata (now viewable)."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in WSI_EXTS:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {ext or '?'}")

    SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    dest = SLIDES_DIR / Path(file.filename).name
    with dest.open("wb") as out:
        while chunk := await file.read(1 << 20):  # 1 MB chunks
            out.write(chunk)
    await file.close()

    # validate it actually opens; drop it otherwise
    try:
        slide = OpenSlide(str(dest))
        w, h = slide.dimensions
        props = slide.properties
        mpp = float(props.get(openslide.PROPERTY_NAME_MPP_X) or 0) or None
        mag = props.get(openslide.PROPERTY_NAME_OBJECTIVE_POWER)
        slide.close()
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"not a readable slide: {exc}")

    sid = dest.name.split(".")[0]
    get_dz.cache_clear()
    return {
        "id": sid,
        "name": dest.name,
        "width": w,
        "height": h,
        "mpp": mpp,
        "magnification": mag,
        "sizeMB": round(dest.stat().st_size / (1024 * 1024)),
    }


@app.delete("/api/slides/{slide_id}")
def delete_slide(slide_id: str):
    """Remove a slide file from disk."""
    path = resolve(slide_id)  # 404 if unknown
    try:
        path.unlink()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"could not delete: {exc}")
    get_dz.cache_clear()
    return {"deleted": slide_id}


@app.get("/api/slides/{slide_id}/info")
def slide_info(slide_id: str):
    slide, dz = get_dz(slide_id)
    props = slide.properties
    return {
        "id": slide_id,
        "width": slide.dimensions[0],
        "height": slide.dimensions[1],
        "mpp": float(props.get(openslide.PROPERTY_NAME_MPP_X) or 0) or None,
        "magnification": props.get(openslide.PROPERTY_NAME_OBJECTIVE_POWER),
        "dziUrl": f"/api/slides/{slide_id}.dzi",
        "levelCount": dz.level_count,
    }


@app.get("/api/slides/{slide_id}.dzi")
def slide_dzi(slide_id: str):
    _, dz = get_dz(slide_id)
    xml = dz.get_dzi(TILE_FORMAT)
    return Response(content=xml, media_type="application/xml")


@app.get("/api/slides/{slide_id}/thumbnail")
def slide_thumbnail(slide_id: str):
    slide, _ = get_dz(slide_id)
    thumb = slide.get_thumbnail((512, 512))
    buf = io.BytesIO()
    thumb.convert("RGB").save(buf, "jpeg", quality=85)
    return Response(content=buf.getvalue(), media_type="image/jpeg")


@app.get("/api/slides/{slide_id}_files/{level}/{tile}")
def slide_tile(slide_id: str, level: int, tile: str):
    # tile looks like "col_row.jpeg"
    name = tile.rsplit(".", 1)[0]
    try:
        col_s, row_s = name.split("_")
        col, row = int(col_s), int(row_s)
    except ValueError:
        raise HTTPException(status_code=400, detail="bad tile name")

    _, dz = get_dz(slide_id)
    if level < 0 or level >= dz.level_count:
        raise HTTPException(status_code=404, detail="bad level")
    try:
        img = dz.get_tile(level, (col, row))
    except (ValueError, IndexError):
        raise HTTPException(status_code=404, detail="tile out of range")

    buf = io.BytesIO()
    img.save(buf, TILE_FORMAT, quality=TILE_QUALITY)
    return Response(
        content=buf.getvalue(),
        media_type=f"image/{TILE_FORMAT}",
        headers={"Cache-Control": "public, max-age=86400"},
    )
