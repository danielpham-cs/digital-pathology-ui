"use client";

import { Microscope, Play, RotateCcw, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export function TopBar() {
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
            <Badge variant="outline" className="font-normal">
              Research use only
            </Badge>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-4 text-xs text-muted md:flex">
        <Meta label="Case" value={id} mono />
        <Divider />
        <Meta label="Patient" value={patient} />
        <Divider />
        <Meta label="Specimen" value={`${organ} · ${stain}`} />
      </div>

      <div className="flex items-center gap-2">
        <StatusPill status={status} />
        {status === "done" ? (
          <>
            <Button variant="outline" size="sm" onClick={resetAnalysis}>
              <RotateCcw /> Reset
            </Button>
            <Button size="sm">
              <FileText /> Report
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={runAnalysis} disabled={status === "running"}>
            {status === "running" ? <Loader2 className="animate-spin" /> : <Play />}
            Run Analysis
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
  if (status === "idle")
    return (
      <Badge variant="outline">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" /> Not analyzed
      </Badge>
    );
  if (status === "running")
    return (
      <Badge variant="primary">
        <Loader2 className="size-3 animate-spin" /> Running
      </Badge>
    );
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3" /> Complete
    </Badge>
  );
}
