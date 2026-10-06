// Base URL of the FastAPI tile server. Override with NEXT_PUBLIC_TILE_API.
export const TILE_API =
  process.env.NEXT_PUBLIC_TILE_API?.replace(/\/$/, "") || "http://localhost:8000";

export interface RemoteSlide {
  id: string;
  name: string;
  sizeMB?: number;
  width: number;
  height: number;
  mpp?: number | null;
  magnification?: string | number | null;
  vendor?: string | null;
  error?: string;
}

// Returns the available real slides, or null if the tile server is unreachable.
export async function fetchSlides(signal?: AbortSignal): Promise<RemoteSlide[] | null> {
  try {
    const res = await fetch(`${TILE_API}/api/slides`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const slides: RemoteSlide[] = (data.slides ?? []).filter((s: RemoteSlide) => !s.error);
    return slides.length ? slides : null;
  } catch {
    return null;
  }
}
