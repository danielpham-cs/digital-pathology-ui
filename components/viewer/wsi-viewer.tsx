"use client";

import { useI18n } from "@/lib/i18n";

import * as React from "react";
import { createPortal } from "react-dom";
import OpenSeadragon from "openseadragon";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateSyntheticSlide, type SlideRegions } from "@/lib/synthetic-slide";
import { fetchSlides, TILE_API } from "@/lib/config";

// Synthetic-slide geometry (used only for the demo overlays / region zoom).
const IMG_W = 2400;
const IMG_H = 1600;
const BASE_MAG = 40; // the synthetic slide represents a 40x scan

export function WSIViewer({ slideId }: { slideId?: string | null }) {
  const { t } = useI18n();
  const ref = React.useRef<HTMLDivElement>(null);
  const osdRef = React.useRef<OpenSeadragon.Viewer | null>(null);
  const [regions, setRegions] = React.useState<SlideRegions | null>(null);
  const [viewerInstance, setViewerInstance] = React.useState<OpenSeadragon.Viewer | null>(null);
  const setViewport = useStore((s) => s.setViewport);
  const setRegionList = useStore((s) => s.setRegions);
  const selectedRegion = useStore((s) => s.selectedRegion);
  const selectRegion = useStore((s) => s.selectRegion);
  const focusRequest = useStore((s) => s.focusRequest);
  const layers = useStore((s) => s.layers);
  const viewMode = useStore((s) => s.viewMode);
  const status = useStore((s) => s.status);

  // Live-slide state: null mpp => synthetic demo; a value => real slide from the
  // tile server. Dims/baseMag live in refs so the OSD event closures stay current.
  const [source, setSource] = React.useState<{ real: boolean; name: string } | null>(null);
  const [slideMpp, setSlideMpp] = React.useState<number | null>(null);
  const [baseMag, setBaseMag] = React.useState(BASE_MAG);
  const dimsRef = React.useRef({ w: IMG_W, h: IMG_H });
  const baseMagRef = React.useRef(BASE_MAG);
  const regionsRef = React.useRef<SlideRegions | null>(null);

  // init the viewer — try the real tile server, fall back to the synthetic
  // slide. The page remounts this (via key) when the slide changes.
  React.useEffect(() => {
    if (!ref.current || osdRef.current) return;
    let cancelled = false;
    const controller = new AbortController();
    let cleanup: (() => void) | null = null;

    (async () => {
      const real = await fetchSlides(controller.signal);
      if (cancelled || !ref.current) return;

      let tileSources: OpenSeadragon.Options["tileSources"];
      if (real && real.length) {
        // honor the requested slide (e.g. an uploaded one); else the first
        const s = (slideId && real.find((x) => x.id === slideId)) || real[0];
        tileSources = `${TILE_API}/api/slides/${s.id}.dzi`;
        dimsRef.current = { w: s.width, h: s.height };
        baseMagRef.current = Number(s.magnification) || 40;
        regionsRef.current = null;
        setBaseMag(baseMagRef.current);
        setSlideMpp(s.mpp ?? null);
        setSource({ real: true, name: s.name });
        setRegions(null);
        setRegionList([]);
      } else {
        const syn = generateSyntheticSlide(IMG_W, IMG_H);
        tileSources = { type: "image", url: syn.dataUrl };
        dimsRef.current = { w: IMG_W, h: IMG_H };
        baseMagRef.current = BASE_MAG;
        regionsRef.current = syn.regions;
        setBaseMag(BASE_MAG);
        setSlideMpp(null);
        setSource({ real: false, name: "Synthetic demo slide" });
        setRegions(syn.regions);
        setRegionList(syn.regions.tumor);
      }

      const viewer = OpenSeadragon({
        element: ref.current,
        tileSources,
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/images/",
        showNavigator: false,
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

      // click a suspected region to select it (synthetic demo only)
      viewer.addHandler("canvas-click", (event) => {
        const rg = regionsRef.current;
        const state = useStore.getState();
        if (!rg || !event.quick || state.status !== "done" || state.viewMode !== "suspicious") return;
        const { w, h } = dimsRef.current;
        const point = viewer.viewport.viewportToImageCoordinates(
          viewer.viewport.pointFromPixel(event.position)
        );
        const hits = rg.tumor
          .map((region, index) => ({ region, index }))
          .filter(({ region }) => Math.hypot(point.x - region.x * w, point.y - region.y * h) <= region.r * w)
          .sort((a, b) => a.region.r - b.region.r);
        if (hits.length) state.selectRegion(hits[0].index);
      });

      const report = () => {
        const zoom = viewer.viewport.getZoom(true);
        const imgZoom = viewer.viewport.viewportToImageZoom(zoom);
        setViewport({ zoom, magnification: imgZoom * baseMagRef.current });
      };
      viewer.addHandler("open", () => {
        setViewerInstance(viewer);
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
        const { w, h } = dimsRef.current;
        if (img.x >= 0 && img.y >= 0 && img.x <= w && img.y <= h) {
          setViewport({ pointer: { x: Math.round(img.x), y: Math.round(img.y) } });
        } else {
          setViewport({ pointer: null });
        }
      };
      el.addEventListener("mousemove", onMove);
      cleanup = () => {
        el.removeEventListener("mousemove", onMove);
        viewer.destroy();
        osdRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      controller.abort();
      cleanup?.();
    };
  }, [setViewport, setRegionList]);

  React.useEffect(() => {
    if (!viewerInstance || !regions || !focusRequest) return;
    if (selectedRegion === null) {
      viewerInstance.viewport.goHome();
      return;
    }
    const region = regions.tumor[selectedRegion];
    if (!region || status !== "done") return;
    // The generator stores radius relative to image width; use image coordinates
    // then convert through the tiled image to avoid distorting non-square slides.
    const radius = region.r * IMG_W * 1.2;
    const left = Math.max(0, region.x * IMG_W - radius);
    const top = Math.max(0, region.y * IMG_H - radius);
    const right = Math.min(IMG_W, region.x * IMG_W + radius);
    const bottom = Math.min(IMG_H, region.y * IMG_H + radius);
    const bounds = viewerInstance.world.getItemAt(0).imageToViewportRectangle(left, top, right - left, bottom - top);
    viewerInstance.viewport.fitBounds(bounds);
  }, [viewerInstance, regions, selectedRegion, focusRequest, status]);

  const aspect = IMG_H / IMG_W; // viewport height for normalized width=1

  const zoomBy = (factor: number) => {
    const v = osdRef.current;
    if (!v) return;
    v.viewport.zoomBy(factor);
    v.viewport.applyConstraints();
  };
  const goHome = () => osdRef.current?.viewport.goHome();
  const goToMag = (mag: number) => {
    const v = osdRef.current;
    if (!v) return;
    const imgZoom = mag / baseMagRef.current;
    v.viewport.zoomTo(v.viewport.imageToViewportZoom(imgZoom));
    v.viewport.applyConstraints();
  };

  return (
    <div className="relative h-full w-full bg-viewer">
      <div ref={ref} className="h-full w-full" />

      {/* depth vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* SVG overlays aligned to the image via OSD overlay div */}
      {viewerInstance && regions && status === "done" && viewMode === "suspicious" && (
        <OverlayMount osd={viewerInstance} aspect={aspect}>
          <svg
            viewBox={`0 0 ${IMG_W} ${IMG_H}`}
            width="100%"
            height="100%"
            style={{ display: "block", overflow: "visible" }}
          >
            <g data-testid="suspicious-regions" aria-label={t("Suspected malignant regions")}>
              {regions.tumor.map((region, i) => (
                <g key={i}>
                  <circle cx={region.x * IMG_W} cy={region.y * IMG_H} r={region.r * IMG_W} fill="var(--danger)" fillOpacity={selectedRegion === i ? 0.22 : 0.12} stroke={selectedRegion === i ? "#facc15" : "#ff5252"} strokeWidth={selectedRegion === i ? 5 : 3} vectorEffect="non-scaling-stroke" />
                  <text x={region.x * IMG_W} y={region.y * IMG_H} textAnchor="middle" fill="white" stroke="#7f1d1d" strokeWidth={3} paintOrder="stroke" fontSize={40} fontWeight={600}>{t("Region")} {i + 1}</text>
                </g>
              ))}
            </g>
            {layers.map((layer) => {
              if (!layer.enabled) return null;
              const op = layer.opacity / 100;
              if (layer.id === "tissue")
                return (
                  <g key="tissue" opacity={op}>
                    <defs>
                      <radialGradient id="tumorGlow">
                        <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.45} />
                        <stop offset="60%" stopColor="var(--danger)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
                      </radialGradient>
                    </defs>
                    {regions.tumor.map((t, i) => (
                      <g key={i}>
                        <circle
                          cx={t.x * IMG_W}
                          cy={t.y * IMG_H}
                          r={t.r * IMG_W}
                          fill="url(#tumorGlow)"
                        />
                        <circle
                          cx={t.x * IMG_W}
                          cy={t.y * IMG_H}
                          r={t.r * IMG_W}
                          fill="none"
                          stroke="var(--danger)"
                          strokeWidth={2.5}
                          strokeDasharray="10 7"
                          strokeOpacity={0.9}
                        />
                      </g>
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

      {status === "done" && viewMode === "suspicious" && (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[230px] rounded-lg bg-black/70 px-3 py-2 text-[11px] text-white">
          <div className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full bg-red-500" />{t("Suspected malignant regions")}</div>
          <p className="mt-1 text-white/70">{t("Demo regions from the synthetic slide; not actual model evidence.")}</p>
        </div>
      )}

      {status === "done" && selectedRegion !== null && (
        <button type="button" onClick={() => selectRegion(null)} className="absolute bottom-14 right-3 rounded-lg bg-black/75 px-3 py-2 text-xs text-white cursor-pointer hover:bg-black">
          {t("Back to full slide")}
        </button>
      )}

      {/* floating glass control bar (zoom · mag presets · scale) */}
      {viewerInstance && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 glass-dark px-1.5 py-1.5 text-white shadow-lg">
          <CtrlButton onClick={() => zoomBy(1.4)} label="Zoom in">
            <Plus className="size-4" />
          </CtrlButton>
          <CtrlButton onClick={() => zoomBy(0.7)} label="Zoom out">
            <Minus className="size-4" />
          </CtrlButton>
          <CtrlButton onClick={goHome} label="Fit">
            <Maximize2 className="size-3.5" />
          </CtrlButton>
          <span className="mx-1 h-5 w-px bg-white/15" />
          {[2, 10, 20, 40].map((m) => (
            <button
              key={m}
              onClick={() => goToMag(m)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            >
              {m}×
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-white/15" />
          <ScaleIndicator mpp={slideMpp} baseMag={baseMag} />
        </div>
      )}

      {/* source badge */}
      {source && (
        <div className="pointer-events-none absolute left-4 bottom-4 flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-[10px] font-medium text-white shadow-lg">
          <span className={`h-1.5 w-1.5 rounded-full ${source.real ? "bg-success" : "bg-warning"}`} />
          {source.real ? t("Live slide") : t("Synthetic demo")}
        </div>
      )}

      {status === "running" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full glass-dark px-4 py-2 text-xs font-medium text-white shadow-lg">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-3" />
            Analyzing slide…
          </div>
        </div>
      )}
    </div>
  );
}

function CtrlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
    >
      {children}
    </button>
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

// Compact scale readout shown inside the control bar.
function ScaleIndicator({ mpp, baseMag }: { mpp: number | null; baseMag: number }) {
  const magnification = useStore((s) => s.magnification);
  const caseMpp = useStore((s) => s.caseData.mpp);
  const effMpp = mpp ?? caseMpp;
  const micronsPerScreenPx = (effMpp * baseMag) / Math.max(magnification, 0.001);
  const microns = Math.round(micronsPerScreenPx * 60);
  return (
    <div className="flex items-center gap-1.5 pl-1 pr-2">
      <div className="h-[3px] w-[60px] rounded-full bg-white/70" />
      <span className="text-[10px] font-medium text-white/80 tabular">{microns} µm</span>
    </div>
  );
}
