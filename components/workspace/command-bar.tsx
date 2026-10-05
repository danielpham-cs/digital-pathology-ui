"use client";

import Link from "next/link";
import {
  Play,
  RotateCcw,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export function CommandBar() {
  const { t } = useI18n();
  const { id, organ, stain, patient } = useStore((s) => s.caseData);
  const status = useStore((s) => s.status);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const resetAnalysis = useStore((s) => s.resetAnalysis);

  return (
    <div className="glass pointer-events-auto flex items-center gap-4 rounded-2xl border border-border px-3 py-2 shadow-lg">
      {/* breadcrumb + case */}
      <div className="flex items-center gap-2 pl-1">
        <span className="text-[11px] font-medium text-muted">{t("Cases")}</span>
        <ChevronRight className="size-3 text-muted/50" />
        <span className="font-mono text-xs font-semibold">{id}</span>
        <Badge variant="outline" className="ml-1 hidden font-normal lg:inline-flex">
          {organ} · {stain}
        </Badge>
        <span className="ml-1 hidden text-[11px] text-muted xl:inline">{patient}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* search */}
        <div className="hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] text-muted md:flex">
          <Search className="size-3.5" />
          <span>{t("Search slides…")}</span>
          <kbd className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[9px]">⌘K</kbd>
        </div>

        <StatusPill status={status} />

        {status === "done" ? (
          <>
            <Button variant="outline" size="sm" onClick={resetAnalysis}>
              <RotateCcw /> {t("Reset")}
            </Button>
            <Link href="/report">
              <Button size="sm">
                <FileText /> {t("Report")}
              </Button>
            </Link>
          </>
        ) : (
          <Button size="sm" onClick={runAnalysis} disabled={status === "running"}>
            {status === "running" ? <Loader2 className="animate-spin" /> : <Play />}
            {t("Run Analysis")}
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "idle" | "running" | "done" }) {
  const { t } = useI18n();
  if (status === "idle")
    return (
      <Badge variant="outline">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" /> {t("Not analyzed")}
      </Badge>
    );
  if (status === "running")
    return (
      <Badge variant="primary">
        <Loader2 className="size-3 animate-spin" /> {t("Running")}
      </Badge>
    );
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3" /> {t("Complete")}
    </Badge>
  );
}
