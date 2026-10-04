"use client";

import { useI18n } from "@/lib/i18n";

import { Microscope, Play, RotateCcw, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export function TopBar() {
  const { t, locale, setLocale } = useI18n();
  const { id, patient, organ, stain } = useStore((s) => s.caseData);
  const status = useStore((s) => s.status);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const resetAnalysis = useStore((s) => s.resetAnalysis);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Microscope className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">PathologyAI</span>
            <Badge variant="outline" className="font-normal">{t("Research use only")}</Badge>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-4 text-xs text-muted md:flex">
        <Meta label={t("Case")} value={id} mono />
        <Divider />
        <Meta label={t("Patient")} value={t(patient)} />
        <Divider />
        <Meta label={t("Specimen")} value={`${t(organ)} · ${stain}`} />
      </div>

      <div className="flex items-center gap-2">
        <div role="group" aria-label={locale === "zh-TW" ? "介面語言" : "Interface language"} className="flex rounded-md border border-border p-0.5">
          {(["zh-TW", "en"] as const).map(language => (
            <button key={language} type="button" aria-pressed={locale === language} onClick={() => setLocale(language)} className={`rounded px-2 py-1 text-xs cursor-pointer ${locale === language ? "bg-primary text-white" : "text-muted hover:bg-surface-muted"}`}>
              {language === "zh-TW" ? "中文" : "English"}
            </button>
          ))}
        </div>
        <StatusPill status={status} />
        {status === "done" ? (
          <>
            <Button variant="outline" size="sm" onClick={resetAnalysis}>
              <RotateCcw />{t("Reset")}</Button>
            <Button size="sm">
              <FileText />{t("Report")}</Button>
          </>
        ) : (
          <Button size="sm" onClick={runAnalysis} disabled={status === "running"}>
            {status === "running" ? <Loader2 className="animate-spin" /> : <Play />}
            {t("Run Analysis")}
          </Button>
        )}
      </div>
    </header>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted/70">{label}</span>
      <span className={`font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="h-3.5 w-px bg-border" />;
}

function StatusPill({ status }: { status: "idle" | "running" | "done" }) {
  const { t } = useI18n();
  if (status === "idle")
    return (
      <Badge variant="outline">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />{t("Not analyzed")}</Badge>
    );
  if (status === "running")
    return (
      <Badge variant="primary">
        <Loader2 className="size-3 animate-spin" />{t("Running")}</Badge>
    );
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3" />{t("Complete")}</Badge>
  );
}
