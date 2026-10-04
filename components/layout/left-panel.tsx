"use client";

import { useI18n } from "@/lib/i18n";

import { Layers, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAG_PRESETS = [2, 10, 20, 40];

export function LeftPanel() {
  const { t } = useI18n();
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const status = useStore((s) => s.status);
  const regions = useStore((s) => s.regions);
  const selectedRegion = useStore((s) => s.selectedRegion);
  const selectRegion = useStore((s) => s.selectRegion);
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-4 panel-scroll">
      <section>
        <SectionTitle>{t("Slide display")}</SectionTitle>
        <div role="group" aria-label={t("Slide display")} className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
          {(["original", "suspicious"] as const).map(mode => (
            <button key={mode} type="button" aria-pressed={viewMode === mode} disabled={mode === "suspicious" && status !== "done"} onClick={() => setViewMode(mode)} className={cn("rounded-md px-2 py-2 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", viewMode === mode ? "bg-primary text-white" : "text-muted hover:bg-surface-muted")}>
              {t(mode === "original" ? "Original image" : "Suspected malignant regions")}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{t(status === "done" ? "Switch to the original image to hide all overlays. Zoom and position are preserved." : "Run analysis to reveal suspected regions.")}</p>
        {viewMode === "suspicious" && <p className="mt-2 rounded-md bg-danger/5 p-2 text-[11px] leading-relaxed text-danger">{t("Demo regions from the synthetic slide; not actual model evidence.")}</p>}
      </section>
      {status === "done" && regions.length > 0 && (
        <section>
          <SectionTitle>{t("Region inspection")}</SectionTitle>
          <p className="mb-2 text-[11px] leading-relaxed text-muted">{t("Select a region to zoom in, or click a marked area on the slide.")}</p>
          <div role="group" aria-label={t("Region inspection")} className="grid grid-cols-3 gap-1.5">
            {regions.map((_, index) => (
              <button key={index} type="button" aria-pressed={selectedRegion === index} onClick={() => selectRegion(index)} className={cn("rounded-md border px-2 py-2 text-xs cursor-pointer", selectedRegion === index ? "border-primary bg-primary text-white" : "border-border hover:bg-surface-muted")}>
                {t("Region")} {index + 1}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => selectRegion(null)} className="mt-2 w-full rounded-md border border-border py-2 text-xs cursor-pointer hover:bg-surface-muted">{t("Back to full slide")}</button>
        </section>
      )}
      <section className={viewMode === "original" ? "opacity-50" : ""}>
        <SectionTitle icon={<Layers className="size-3.5" />}>{t("Overlay layers")}</SectionTitle>
        <div className="space-y-3">
          {layers.map((layer) => (
            <div key={layer.id} className="rounded-[var(--radius)] border border-border p-2.5">
              <button
                disabled={viewMode === "original"}
                onClick={() => toggleLayer(layer.id)}
                className="flex w-full items-center gap-2 text-left cursor-pointer"
              >
                <span
                  className="h-3 w-3 rounded-sm border"
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
              <div className={cn("mt-2.5 transition-opacity", layer.enabled ? "opacity-100" : "opacity-40 pointer-events-none")}>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>{t("Opacity")}</span>
                  <span className="tabular">{layer.opacity}%</span>
                </div>
                <input
                  disabled={viewMode === "original" || !layer.enabled}
                  aria-label={`${t(layer.label)} ${t("Opacity")}`}
                  type="range"
                  min={0}
                  max={100}
                  value={layer.opacity}
                  onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                  className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-[color:var(--primary)]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{t("Magnification")}</SectionTitle>
        <div className="grid grid-cols-4 gap-1.5">
          {MAG_PRESETS.map((m) => (
            <div
              key={m}
              className="rounded-md border border-border bg-surface-muted py-1.5 text-center text-xs font-medium text-muted"
            >
              {m}×
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted">{t("Scroll to zoom · drag to pan · double-click to zoom in. Use the navigator (top-left) to jump across the slide.")}</p>
      </section>
    </aside>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {icon}
      {children}
    </h2>
  );
}
