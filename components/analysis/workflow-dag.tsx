"use client";

import { useI18n } from "@/lib/i18n";

import { Check, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  PIPELINE_DAG,
  DAG_NODE_W,
  DAG_NODE_H,
  DAG_CANVAS_W,
  DAG_CANVAS_H,
  type DagNode,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type NodeState = "pending" | "active" | "done";

function nodeState(node: DagNode, activeStep: number, status: string): NodeState {
  if (status === "done" || node.step < activeStep) return "done";
  if (node.step === activeStep && status === "running") return "active";
  return "pending";
}

export function WorkflowDAG() {
  const { t } = useI18n();
  const activeStep = useStore((s) => s.activeStep);
  const status = useStore((s) => s.status);
  const stepProgress = useStore((s) => s.stepProgress);

  const byId = (id: string) => PIPELINE_DAG.nodes.find((n) => n.id === id)!;

  return (
    <div className="relative mx-auto" style={{ width: DAG_CANVAS_W, height: DAG_CANVAS_H }}>
      {/* edges */}
      <svg
        className="absolute inset-0"
        width={DAG_CANVAS_W}
        height={DAG_CANVAS_H}
        style={{ pointerEvents: "none" }}
      >
        {PIPELINE_DAG.edges.map(([from, to]) => {
          const a = byId(from);
          const b = byId(to);
          const x1 = a.x;
          const y1 = a.y + DAG_NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y - DAG_NODE_H / 2;
          const my = (y1 + y2) / 2;
          const toState = nodeState(b, activeStep, status);
          const active = toState === "done" || toState === "active";
          return (
            <path
              key={`${from}-${to}`}
              d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
              fill="none"
              stroke={active ? "var(--primary)" : "var(--border)"}
              strokeWidth={active ? 2 : 1.5}
              strokeDasharray={toState === "active" ? "4 3" : undefined}
            />
          );
        })}
      </svg>

      {/* nodes */}
      {PIPELINE_DAG.nodes.map((n) => {
        const st = nodeState(n, activeStep, status);
        return (
          <div
            key={n.id}
            className={cn(
              "absolute flex items-center gap-2 rounded-[var(--radius)] border px-2.5 transition-colors",
              st === "done" && "border-success/40 bg-success/5",
              st === "active" && "border-primary bg-primary/5 shadow-sm",
              st === "pending" && "border-border bg-surface"
            )}
            style={{
              width: DAG_NODE_W,
              height: DAG_NODE_H,
              left: n.x - DAG_NODE_W / 2,
              top: n.y - DAG_NODE_H / 2,
            }}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                st === "done" && "border-success bg-success text-white",
                st === "active" && "border-primary bg-primary/10 text-primary",
                st === "pending" && "border-border text-muted"
              )}
            >
              {st === "done" ? (
                <Check className="size-3" />
              ) : st === "active" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                n.step + 1
              )}
            </span>
            <div className="min-w-0 leading-tight">
              <div
                className={cn(
                  "truncate text-xs font-medium",
                  st === "pending" ? "text-muted" : "text-foreground"
                )}
              >
                {t(n.label)}
              </div>
              <div className="truncate font-mono text-[9px] text-muted">{n.tool}</div>
            </div>
            {st === "active" && (
              <span className="ml-auto text-[9px] font-semibold tabular text-primary">
                {stepProgress}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
