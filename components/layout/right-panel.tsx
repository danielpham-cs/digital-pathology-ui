"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Microscope,
  Activity,
  TrendingDown,
  ShieldCheck,
  XCircle,
  CircleAlert,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TissueDonut, CellBars, SurvivalCurve } from "@/components/analysis/charts";
import { WorkflowDAG } from "@/components/analysis/workflow-dag";
import { cn } from "@/lib/utils";
import type { QCCheck, GuidelineReference } from "@/lib/mock-data";

export function RightPanel() {
  const status = useStore((s) => s.status);

  return (
    <aside className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-border bg-background p-4 panel-scroll">
      {status === "idle" && <IdleState />}
      {status === "running" && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <Badge variant="primary">Running</Badge>
          </CardHeader>
          <CardContent>
            <WorkflowDAG />
          </CardContent>
        </Card>
      )}
      {status === "done" && <Results />}
    </aside>
  );
}

function IdleState() {
  const runAnalysis = useStore((s) => s.runAnalysis);
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Microscope className="size-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold">Ready to analyze</h3>
        <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-muted">
          The pipeline below runs deterministic models as a DAG — each node is a dedicated tool, not
          a free-form agent.
        </p>
        <Button size="sm" className="mt-3" onClick={runAnalysis}>
          Run analysis
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Planned workflow</CardTitle>
          <Badge variant="outline">DAG</Badge>
        </CardHeader>
        <CardContent>
          <WorkflowDAG />
        </CardContent>
      </Card>
    </div>
  );
}

function Results() {
  const data = useStore((s) => s.caseData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Diagnosis header card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Primary diagnosis
              </div>
              <div className="mt-1 text-base font-semibold leading-snug">
                {data.diagnosis.label}
              </div>
            </div>
            <SeverityBadge severity={data.diagnosis.severity} />
          </div>
          <ConfidenceRow value={data.diagnosis.confidence} />
          <FeedbackBar />
        </CardContent>
      </Card>

      {data.qc.ood && <OODBanner score={data.qc.oodScore} />}

      <Tabs defaultValue="tissue">
        <TabsList>
          <TabsTrigger value="tissue">Tissue</TabsTrigger>
          <TabsTrigger value="cells">Cells</TabsTrigger>
          <TabsTrigger value="staging">Staging</TabsTrigger>
          <TabsTrigger value="survival">Survival</TabsTrigger>
          <TabsTrigger value="qc">QC</TabsTrigger>
        </TabsList>

        <TabsContent value="tissue" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Tissue composition</CardTitle>
              <Badge variant="outline">Segmentation</Badge>
            </CardHeader>
            <CardContent>
              <TissueDonut data={data.tissue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cells" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Cell detection</CardTitle>
              <Badge variant="outline">HoVer-Net</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Total cells" value={data.cells.total.toLocaleString()} />
                <Stat label="Density" value={`${data.cells.densityPerMm2.toLocaleString()} /mm²`} />
              </div>
              <CellBars data={data.cells.types} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staging" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Tumor staging</CardTitle>
              <Badge variant="outline">MIL</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <StageStepper stage={data.staging.stage} />
              <ConfidenceRow value={data.staging.confidence} />
              <p className="text-xs leading-relaxed text-muted">{data.staging.note}</p>
              <GuidelineCard guideline={data.staging.guideline} />
              <RefineControl />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="survival" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Survival analysis</CardTitle>
              <RiskBadge risk={data.survival.risk} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Risk group" value={data.survival.risk} icon={<TrendingDown className="size-3.5" />} />
                <Stat label="Median survival" value={`${data.survival.medianMonths} mo`} />
              </div>
              <SurvivalCurve data={data.survival.curve} median={data.survival.medianMonths} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle>Quality control</CardTitle>
              {data.qc.ood ? (
                <Badge variant="warning">
                  <CircleAlert className="size-3" /> OOD
                </Badge>
              ) : (
                <Badge variant="success">
                  <ShieldCheck className="size-3" /> In-distribution
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {data.qc.checks.map((c) => (
                <QCRow key={c.label} check={c} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI narrative */}
      <Card>
        <CardHeader>
          <CardTitle>AI-generated summary</CardTitle>
          <Badge variant="primary">
            <Activity className="size-3" /> LLM
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed text-muted">{data.narrative}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConfidenceRow({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted">Model confidence</span>
        <span className="font-semibold tabular">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular">{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "benign" | "malignant" | "uncertain" }) {
  if (severity === "malignant")
    return (
      <Badge variant="danger">
        <AlertTriangle className="size-3" /> Malignant
      </Badge>
    );
  if (severity === "benign")
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3" /> Benign
      </Badge>
    );
  return (
    <Badge variant="warning">
      <CircleAlert className="size-3" /> Uncertain
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: "Low" | "Intermediate" | "High" }) {
  const variant = risk === "High" ? "danger" : risk === "Low" ? "success" : "warning";
  return <Badge variant={variant as "danger" | "success" | "warning"}>{risk} risk</Badge>;
}

function StageStepper({ stage }: { stage: "T1" | "T2" | "T3" | "T4" }) {
  const stages: Array<"T1" | "T2" | "T3" | "T4"> = ["T1", "T2", "T3", "T4"];
  const activeIdx = stages.indexOf(stage);
  return (
    <div className="flex items-center">
      {stages.map((s, i) => {
        const active = i === activeIdx;
        const passed = i < activeIdx;
        return (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-danger text-white ring-4 ring-danger/15"
                    : passed
                    ? "bg-danger/20 text-danger"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {s}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < activeIdx ? "bg-danger/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QCRow({ check }: { check: QCCheck }) {
  const map = {
    pass: { icon: <CheckCircle2 className="size-4 text-success" />, },
    warn: { icon: <CircleAlert className="size-4 text-warning" /> },
    fail: { icon: <XCircle className="size-4 text-danger" /> },
  };
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border p-2.5">
      {map[check.status].icon}
      <div className="flex-1">
        <div className="text-xs font-medium">{check.label}</div>
        <div className="text-[11px] text-muted">{check.detail}</div>
      </div>
    </div>
  );
}

function FeedbackBar() {
  const vote = useStore((s) => s.diagnosisVote);
  const setVote = useStore((s) => s.setVote);
  return (
    <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
      <span className="text-[11px] text-muted">Agree with this result?</span>
      <div className="ml-auto flex gap-1">
        <button
          onClick={() => setVote("up")}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer",
            vote === "up"
              ? "border-success bg-success/10 text-success"
              : "border-border text-muted hover:text-foreground"
          )}
        >
          <ThumbsUp className="size-3.5" />
        </button>
        <button
          onClick={() => setVote("down")}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer",
            vote === "down"
              ? "border-danger bg-danger/10 text-danger"
              : "border-border text-muted hover:text-foreground"
          )}
        >
          <ThumbsDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function GuidelineCard({ guideline }: { guideline: GuidelineReference }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-muted/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
        <BookOpen className="size-3.5 text-primary" />
        Clinical guideline
      </div>
      <div className="mb-2 text-[11px] font-medium text-muted">{guideline.system}</div>
      <div className="space-y-1">
        {guideline.criteria.map((c) => {
          const matched = c.stage === guideline.matched;
          return (
            <div
              key={c.stage}
              className={cn(
                "flex items-start gap-2 rounded-md px-2 py-1 text-[11px]",
                matched ? "bg-primary/10 text-foreground" : "text-muted"
              )}
            >
              <span className={cn("font-semibold tabular", matched && "text-primary")}>
                {c.stage}
              </span>
              <span className="flex-1">{c.rule}</span>
              {matched && <CheckCircle2 className="size-3.5 shrink-0 text-primary" />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{guideline.rationale}</p>
    </div>
  );
}

function RefineControl() {
  const refine = useStore((s) => s.refineStaging);
  const rounds = useStore((s) => s.refineRounds);
  return (
    <div className="flex items-center justify-between rounded-[var(--radius)] border border-dashed border-border p-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <div className="leading-tight">
          <div className="text-[11px] font-medium">Refine with feedback</div>
          <div className="text-[10px] text-muted">
            {rounds > 0 ? `Model updated ×${rounds}` : "Active learning · updates in seconds"}
          </div>
        </div>
      </div>
      <Button variant="subtle" size="sm" onClick={refine}>
        Refine
      </Button>
    </div>
  );
}

function OODBanner({ score }: { score: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-warning/40 bg-warning/10 p-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      <div>
        <div className="text-xs font-semibold text-[color:#b45309]">Out-of-distribution slide</div>
        <div className="text-[11px] text-[color:#b45309]/80">
          OOD score {score.toFixed(2)} — results may be unreliable. Pathologist review recommended.
        </div>
      </div>
    </div>
  );
}
