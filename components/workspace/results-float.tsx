"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { PanelRightClose, PanelRightOpen, Activity } from "lucide-react";
import { AnalysisContent } from "@/components/layout/right-panel";
import { useStore } from "@/lib/store";

export function ResultsFloat() {
  const [open, setOpen] = React.useState(true);
  const status = useStore((s) => s.status);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass pointer-events-auto flex h-full w-[400px] flex-col overflow-hidden rounded-2xl border border-border shadow-xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Analysis</div>
                  <div className="text-[10px] text-muted">
                    {status === "done"
                      ? "Results ready"
                      : status === "running"
                      ? "In progress…"
                      : "Not started"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-hover cursor-pointer"
              >
                <PanelRightClose className="size-4" />
              </button>
            </div>

            {/* scrollable content */}
            <div className="flex-1 overflow-y-auto p-3.5 panel-scroll">
              <AnalysisContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* reopen tab */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="glass pointer-events-auto flex items-center gap-2 self-start rounded-2xl border border-border px-3 py-2.5 shadow-lg hover:bg-surface-hover cursor-pointer"
        >
          <PanelRightOpen className="size-4 text-primary" />
          <span className="text-xs font-semibold">Analysis</span>
        </button>
      )}
    </>
  );
}
