"use client";

import * as React from "react";
import Link from "next/link";
import {
  Microscope,
  ArrowLeft,
  Download,
  CheckCircle2,
  CircleAlert,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { TissueDonut, CellBars, SurvivalCurve } from "@/components/analysis/charts";

export default function ReportPage() {
  const data = useStore((s) => s.caseData);
  const refineRounds = useStore((s) => s.refineRounds);
  const [date, setDate] = React.useState("");

  React.useEffect(() => {
    setDate(
      new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  return (
    <div className="min-h-screen bg-background py-0 md:py-8">
      {/* toolbar (not printed) */}
      <div className="no-print sticky top-0 z-10 mb-6 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:static md:mx-auto md:w-[210mm] md:rounded-lg md:border">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft /> Back to workspace
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="a4 mx-auto border border-border shadow-sm md:shadow-lg">
        <div className="flex min-h-full flex-col px-[18mm] py-[16mm]">
          {/* header */}
          <header className="flex items-start justify-between border-b-2 border-foreground pb-4">
            <div className="flex items-center gap-3">
              <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-lg text-primary-foreground">
                <Microscope className="size-6" />
              </div>
              <div>
                <h1 className="gradient-text text-lg font-bold tracking-tight">PathologyAI</h1>
                <p className="text-[11px] text-muted">Computational Pathology Report</p>
              </div>
            </div>
            <div className="text-right text-[11px] leading-relaxed">
              <div className="font-semibold text-foreground">AI-ASSISTED ANALYSIS</div>
              <div className="text-muted">Report generated</div>
              <div className="tabular text-foreground">{date || "—"}</div>
            </div>
          </header>

          {/* case meta */}
          <section className="grid grid-cols-4 gap-x-4 gap-y-2 border-b border-border py-4 text-[11px]">
            <Meta label="Case ID" value={data.id} mono />
            <Meta label="Patient" value={data.patient} />
            <Meta label="Specimen" value={data.organ} />
            <Meta label="Stain" value={data.stain} />
            <Meta label="Magnification" value={data.magnification} />
            <Meta label="Resolution" value={`${data.mpp} µm/px`} />
            <Meta label="Source" value={data.source} className="col-span-2" />
          </section>

          {/* QC banner */}
          <QCBanner ood={data.qc.ood} score={data.qc.oodScore} />

          {/* primary diagnosis */}
          <Section title="1. Diagnostic Impression">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-base font-semibold">{data.diagnosis.label}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
                  {data.diagnosis.severity}
                </div>
              </div>
              <ConfidencePill value={data.diagnosis.confidence} />
            </div>
          </Section>

          {/* tissue + cells */}
          <div className="grid grid-cols-2 gap-6">
            <Section title="2. Tissue Composition">
              <TissueDonut data={data.tissue} />
            </Section>
            <Section title="3. Cellular Analysis">
              <div className="mb-2 flex gap-4 text-[11px]">
                <span>
                  <span className="text-muted">Total cells </span>
                  <span className="font-semibold tabular">{data.cells.total.toLocaleString()}</span>
                </span>
                <span>
                  <span className="text-muted">Density </span>
                  <span className="font-semibold tabular">
                    {data.cells.densityPerMm2.toLocaleString()}/mm²
                  </span>
                </span>
              </div>
              <CellBars data={data.cells.types} />
            </Section>
          </div>

          {/* staging */}
          <Section title="4. Tumor Staging">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-danger">{data.staging.stage}</span>
                  <ConfidencePill value={data.staging.confidence} />
                  {refineRounds > 0 && (
                    <span className="text-[10px] text-muted">
                      · refined ×{refineRounds} (active learning)
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-muted">
                  {data.staging.guideline.rationale}
                </p>
              </div>
              <div className="w-[85mm] rounded-md border border-border bg-surface-muted/40 p-2.5">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {data.staging.guideline.system}
                </div>
                {data.staging.guideline.criteria.map((c) => {
                  const matched = c.stage === data.staging.guideline.matched;
                  return (
                    <div
                      key={c.stage}
                      className={`flex gap-2 py-0.5 text-[10px] ${
                        matched ? "font-medium text-foreground" : "text-muted"
                      }`}
                    >
                      <span className={`tabular ${matched ? "text-primary" : ""}`}>{c.stage}</span>
                      <span className="flex-1">{c.rule}</span>
                      {matched && <CheckCircle2 className="size-3 shrink-0 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* survival */}
          <Section title="5. Survival Analysis">
            <div className="mb-2 flex gap-4 text-[11px]">
              <span>
                <span className="text-muted">Risk group </span>
                <span className="font-semibold">{data.survival.risk}</span>
              </span>
              <span>
                <span className="text-muted">Median survival </span>
                <span className="font-semibold tabular">{data.survival.medianMonths} months</span>
              </span>
            </div>
            <SurvivalCurve data={data.survival.curve} median={data.survival.medianMonths} />
          </Section>

          {/* QC checks */}
          <Section title="6. Quality Control">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {data.qc.checks.map((c) => (
                <div key={c.label} className="flex items-start gap-2 text-[11px]">
                  {c.status === "pass" ? (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  ) : c.status === "warn" ? (
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  ) : (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-danger" />
                  )}
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-muted">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* narrative */}
          <Section title="7. Narrative Summary">
            <p className="text-[11px] leading-relaxed text-foreground/90">{data.narrative}</p>
          </Section>

          {/* footer */}
          <footer className="mt-auto border-t border-border pt-4">
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-2.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p className="text-[10px] leading-relaxed text-[color:#b45309]">
                <strong>AI-generated — for research use only.</strong> This report was produced by
                automated models and does not constitute a clinical diagnosis. All findings require
                review and confirmation by a qualified pathologist. Not a medical device.
              </p>
            </div>
            <div className="mt-4 flex items-end justify-between text-[10px] text-muted">
              <div>
                <div className="mb-6 h-px w-[55mm] border-b border-muted/40" />
                Reviewing pathologist (signature)
              </div>
              <div className="text-right">
                <div className="font-mono">{data.id}</div>
                <div>PathologyAI · v2026.10</div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <div className="no-print h-8" />
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[9px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`font-medium ${mono ? "font-mono text-[10px]" : ""}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-break py-4">
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ConfidencePill({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tabular">
      {Math.round(value * 100)}% confidence
    </span>
  );
}

function QCBanner({ ood, score }: { ood: boolean; score: number }) {
  if (ood)
    return (
      <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-[11px] font-medium text-[color:#b45309]">
        <AlertTriangle className="size-4" />
        Slide flagged out-of-distribution (OOD score {score.toFixed(2)}) — interpret with caution.
      </div>
    );
  return (
    <div className="mt-4 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-[11px] font-medium text-success">
      <CheckCircle2 className="size-4" />
      Quality control passed · slide in-distribution (OOD score {score.toFixed(2)})
    </div>
  );
}
