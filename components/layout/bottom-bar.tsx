"use client";

import { useI18n } from "@/lib/i18n";

import { useStore } from "@/lib/store";

export function BottomBar() {
  const { t } = useI18n();
  const zoom = useStore((s) => s.zoom);
  const magnification = useStore((s) => s.magnification);
  const pointer = useStore((s) => s.pointer);
  const { mpp, source } = useStore((s) => s.caseData);

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-surface px-4 text-[11px] text-muted">
      <div className="flex items-center gap-4 tabular">
        <span>{t("Zoom")}<span className="font-medium text-foreground">{(zoom).toFixed(2)}×</span>
        </span>
        <span>{t("Mag")}<span className="font-medium text-foreground">{magnification.toFixed(1)}×</span>
        </span>
        <span>
          {mpp} µm/px
        </span>
        <span>
          {pointer ? (
            <>
              x <span className="font-medium text-foreground">{pointer.x}</span> · y{" "}
              <span className="font-medium text-foreground">{pointer.y}</span>
            </>
          ) : (
            <span className="text-muted/60">x — · y —</span>
          )}
        </span>
      </div>
      <span className="hidden sm:inline">{t(source)}</span>
    </footer>
  );
}
