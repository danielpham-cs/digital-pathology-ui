"use client";

import * as React from "react";
import { Layers, Eye, EyeOff, ChevronDown, Crosshair, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LayersFloat() {
  const { t } = useI18n();
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);
  const status = useStore((s) => s.status);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const regions = useStore((s) => s.regions);
  const selectedRegion = useStore((s) => s.selectedRegion);
  const selectRegion = useStore((s) => s.selectRegion);
  const [open, setOpen] = React.useState(true);

  const showRegions = status === "done" && viewMode === "suspicious";

  return (
    <div className="glass pointer-events-auto w-[248px] overflow-hidden rounded-2xl border border-border shadow-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 cursor-pointer"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="size-3.5" />
        </div>
        <span className="text-xs font-semibold">{t("Slide display")}</span>
        <ChevronDown
          className={cn("ml-auto size-4 text-muted transition-transform", !open && "-rotate-90")}
        />
      </button>

      {open && (
        <div className="max-h-[56vh] space-y-3 overflow-y-auto px-3 pb-3 panel-scroll">
          {/* view mode */}
          <div className="space-y-1.5">
            {(["original", "suspicious"] as const).map((mode) => {
              const activeMode = viewMode === mode;
              const disabled = mode === "suspicious" && status !== "done";
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={disabled}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                    activeMode
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border text-muted hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  {mode === "suspicious" && <Crosshair className="size-3.5 shrink-0 text-danger" />}
                  <span className="flex-1">
                    {t(mode === "original" ? "Original image" : "Suspected malignant regions")}
                  </span>
                </button>
              );
            })}
            <p className="px-0.5 text-[10px] leading-relaxed text-muted">
              {t(
                status === "done"
                  ? "Switch to the original image to hide all overlays. Zoom and position are preserved."
                  : "Run analysis to reveal suspected regions."
              )}
            </p>
          </div>

          {/* overlay layers */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted/70">
              {t("Overlay layers")}
            </div>
            {layers.map((layer) => (
              <div key={layer.id} className="rounded-xl border border-border bg-surface/50 p-2.5">
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className="flex w-full items-center gap-2 text-left cursor-pointer"
                >
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{
                      background: layer.enabled ? layer.color : "transparent",
                      borderColor: layer.color,
                    }}
                  />
                  <span className="flex-1 text-xs font-medium">{t(layer.label)}</span>
                  {layer.enabled ? (
                    <Eye className="size-3.5 text-primary" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted" />
                  )}
                </button>
                <div
                  className={cn(
                    "mt-2 transition-opacity",
                    layer.enabled ? "opacity-100" : "pointer-events-none opacity-40"
                  )}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={layer.opacity}
                    onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-[color:var(--primary)]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* region inspection */}
          {showRegions && regions.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted/70">
                {t("Region inspection")}
              </div>
              {regions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => selectRegion(selectedRegion === i ? null : i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                    selectedRegion === i
                      ? "border-danger/50 bg-danger/10 text-foreground"
                      : "border-border text-muted hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold"
                    style={{ background: "var(--danger)", color: "#fff" }}
                  >
                    {i + 1}
                  </span>
                  {t("Region")} {i + 1}
                </button>
              ))}
              {selectedRegion !== null && (
                <button
                  onClick={() => selectRegion(null)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-primary hover:bg-surface-hover cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  {t("Back to full slide")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
