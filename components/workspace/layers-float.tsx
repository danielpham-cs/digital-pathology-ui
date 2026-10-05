"use client";

import * as React from "react";
import { Layers, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LayersFloat() {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);
  const [open, setOpen] = React.useState(true);

  return (
    <div className="glass pointer-events-auto w-[248px] overflow-hidden rounded-2xl border border-border shadow-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 cursor-pointer"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="size-3.5" />
        </div>
        <span className="text-xs font-semibold">Overlay layers</span>
        <ChevronDown
          className={cn("ml-auto size-4 text-muted transition-transform", !open && "-rotate-90")}
        />
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3">
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
                <span className="flex-1 text-xs font-medium">{layer.label}</span>
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
      )}
    </div>
  );
}
