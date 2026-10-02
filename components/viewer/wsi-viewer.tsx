"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import OpenSeadragon from "openseadragon";
import { useStore } from "@/lib/store";
import { generateSyntheticSlide, type SlideRegions } from "@/lib/synthetic-slide";

const IMG_W = 2400;
const IMG_H = 1600;
const BASE_MAG = 40; // the synthetic slide represents a 40x scan

export function WSIViewer() {
  const ref = React.useRef<HTMLDivElement>(null);
  const osdRef = React.useRef<OpenSeadragon.Viewer | null>(null);
  const [regions, setRegions] = React.useState<SlideRegions | null>(null);
  const [ready, setReady] = React.useState(false);
  const setViewport = useStore((s) => s.setViewport);
  const layers = useStore((s) => s.layers);
  const status = useStore((s) => s.status);

  // init viewer once
  React.useEffect(() => {
    if (!ref.current || osdRef.current) return;
    const { dataUrl, regions } = generateSyntheticSlide(IMG_W, IMG_H);
    setRegions(regions);

    const viewer = OpenSeadragon({
      element: ref.current,
      tileSources: { type: "image", url: dataUrl },
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/images/",
      showNavigator: true,
      navigatorPosition: "TOP_LEFT",
      navigatorHeight: 86,
      navigatorWidth: 128,
      navigatorBackground: "#0a0e14",
      navigatorBorderColor: "#334155",
      showNavigationControl: false,
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      animationTime: 0.5,
      springStiffness: 7,
      minZoomImageRatio: 0.6,
      maxZoomPixelRatio: 3,
      visibilityRatio: 1,
      crossOriginPolicy: "Anonymous",
    });
    osdRef.current = viewer;

    const report = () => {
      const zoom = viewer.viewport.getZoom(true);
      const imgZoom = viewer.viewport.viewportToImageZoom(zoom);
      setViewport({ zoom, magnification: imgZoom * BASE_MAG });
    };
    viewer.addHandler("open", () => {
      setReady(true);
      report();
    });
    viewer.addHandler("zoom", report);
    viewer.addHandler("animation", report);

    const el = ref.current;
    const onMove = (e: MouseEvent) => {
      if (!viewer.world.getItemCount()) return;
      const rect = el.getBoundingClientRect();
      const vp = viewer.viewport.pointFromPixel(
        new OpenSeadragon.Point(e.clientX - rect.left, e.clientY - rect.top)
      );
      const img = viewer.viewport.viewportToImageCoordinates(vp);
      if (img.x >= 0 && img.y >= 0 && img.x <= IMG_W && img.y <= IMG_H) {
        setViewport({ pointer: { x: Math.round(img.x), y: Math.round(img.y) } });
      } else {
        setViewport({ pointer: null });
      }
    };
    el.addEventListener("mousemove", onMove);

    return () => {
      el.removeEventListener("mousemove", onMove);
      viewer.destroy();
      osdRef.current = null;
    };
  }, [setViewport]);

  const aspect = IMG_H / IMG_W; // viewport height for normalized width=1

  return (
    <div className="relative h-full w-full bg-viewer">
      <div ref={ref} className="h-full w-full" />

      {/* SVG overlays aligned to the image via OSD overlay div */}
      {ready && regions && (
        <OverlayMount osd={osdRef.current!} aspect={aspect}>
          <svg
            viewBox={`0 0 ${IMG_W} ${IMG_H}`}
            width="100%"
            height="100%"
            style={{ display: "block", overflow: "visible" }}
          >
            {layers.map((layer) => {
              if (!layer.enabled) return null;
              const op = layer.opacity / 100;
              if (layer.id === "tissue")
                return (
                  <g key="tissue" opacity={op}>
                    {regions.tumor.map((t, i) => (
                      <circle
                        key={i}
                        cx={t.x * IMG_W}
                        cy={t.y * IMG_H}
                        r={t.r * IMG_W}
                        fill="var(--danger)"
                        stroke="var(--danger)"
                        strokeWidth={6}
                        fillOpacity={0.28}
                      />
                    ))}
                  </g>
                );
              if (layer.id === "cells")
                return (
                  <g key="cells" opacity={op}>
                    {regions.cells.map((c, i) => (
                      <circle
                        key={i}
                        cx={c.x * IMG_W}
                        cy={c.y * IMG_H}
                        r={5}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={2}
                      />
                    ))}
                  </g>
                );
              if (layer.id === "attention")
                return (
                  <g key="attention" opacity={op}>
                    <defs>
                      <radialGradient id="attn">
                        <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                      </radialGradient>
                    </defs>
                    {regions.tumor.map((t, i) => (
                      <circle
                        key={i}
                        cx={t.x * IMG_W}
                        cy={t.y * IMG_H}
                        r={t.r * IMG_W * 1.5}
                        fill="url(#attn)"
                      />
                    ))}
                  </g>
                );
              return null;
            })}
          </svg>
        </OverlayMount>
      )}

      {/* scale bar */}
      <ScaleBar />

      {status === "running" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/55 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            Analyzing slide…
          </div>
        </div>
      )}
    </div>
  );
}

// Mounts React children into an OSD overlay div covering the whole image.
function OverlayMount({
  osd,
  aspect,
  children,
}: {
  osd: OpenSeadragon.Viewer;
  aspect: number;
  children: React.ReactNode;
}) {
  const [node] = React.useState(() => {
    const d = document.createElement("div");
    d.style.pointerEvents = "none";
    return d;
  });
  React.useEffect(() => {
    osd.addOverlay({ element: node, location: new OpenSeadragon.Rect(0, 0, 1, aspect) });
    return () => {
      try {
        osd.removeOverlay(node);
      } catch {}
    };
  }, [osd, node, aspect]);
  return createPortal(children, node);
}

function ScaleBar() {
  const magnification = useStore((s) => s.magnification);
  const mpp = useStore((s) => s.caseData.mpp);
  // bar represents 100 screen px → convert to microns using current mag
  const micronsPerScreenPx = (mpp * BASE_MAG) / Math.max(magnification, 0.001);
  const microns = Math.round(micronsPerScreenPx * 100);
  return (
    <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
      <span className="text-[10px] font-medium text-white/80 tabular">{microns} µm</span>
      <div className="h-1 w-[100px] rounded-full bg-white/80" />
    </div>
  );
}
