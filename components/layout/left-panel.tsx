"use client";

import { Layers, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAG_PRESETS = [2, 10, 20, 40];

export function LeftPanel() {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-4 panel-scroll">
      <section>
        <SectionTitle icon={<Layers className="size-3.5" />}>Overlay layers</SectionTitle>
        <div className="space-y-3">
          {layers.map((layer) => (
            <div key={layer.id} className="rounded-[var(--radius)] border border-border p-2.5">
              <button
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
                <span className="flex-1 text-xs font-medium">{layer.label}</span>
                {layer.enabled ? (
                  <Eye className="size-3.5 text-primary" />
                ) : (
                  <EyeOff className="size-3.5 text-muted" />
                )}
              </button>
              <div className={cn("mt-2.5 transition-opacity", layer.enabled ? "opacity-100" : "opacity-40 pointer-events-none")}>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Opacity</span>
                  <span className="tabular">{layer.opacity}%</span>
                </div>
                <input
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
        <SectionTitle>Magnification</SectionTitle>
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
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
          Scroll to zoom · drag to pan · double-click to zoom in. Use the navigator (top-left) to
          jump across the slide.
        </p>
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
