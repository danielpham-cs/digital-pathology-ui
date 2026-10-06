// Tile-server base URL. Empty = same-origin: the browser calls /api on the
// frontend host and Next proxies it to the backend (see next.config.ts), so it
// works on localhost and on a LAN IP without rebuilding. Override only to point
// the browser directly at a separate backend host.
export const TILE_API = process.env.NEXT_PUBLIC_TILE_API?.replace(/\/$/, "") ?? "";

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
