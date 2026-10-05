"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Users,
  Globe,
  Upload,
  Search,
  ChevronRight,
  Layers,
  CheckCircle2,
  Loader2,
  Clock,
  HardDrive,
} from "lucide-react";
import { Sidebar } from "@/components/shell/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SLIDE_LIST, type SlideRow } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COLLECTIONS = [
  { id: "personal", icon: User, label: "Personal", hint: "Your private slides" },
  { id: "shared", icon: Users, label: "Shared with me", hint: "Across your lab" },
  { id: "public", icon: Globe, label: "Public Samples", hint: "TCGA cohort" },
] as const;

export default function DashboardPage() {
  const [collection, setCollection] = React.useState<SlideRow["collection"]>("personal");
  const [query, setQuery] = React.useState("");

  const rows = SLIDE_LIST.filter(
    (s) =>
      s.collection === collection &&
      (query === "" || `${s.name} ${s.organ} ${s.id}`.toLowerCase().includes(query.toLowerCase()))
  );

  const analyzed = SLIDE_LIST.filter((s) => s.status === "Analyzed").length;
  const processing = SLIDE_LIST.filter((s) => s.status === "Processing").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active="dashboard" />

      <main className="flex-1 overflow-y-auto panel-scroll">
        <div className="mx-auto max-w-[1100px] px-8 py-8">
          {/* header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="mt-1 text-sm text-muted">
                Manage whole-slide images and launch AI analysis.
              </p>
            </div>
            <Button className="shine">
              <Upload /> Upload slide
            </Button>
          </div>

          {/* stat row */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <StatCard icon={<Layers className="size-4" />} label="Total slides" value={SLIDE_LIST.length} />
            <StatCard icon={<CheckCircle2 className="size-4 text-success" />} label="Analyzed" value={analyzed} />
            <StatCard icon={<Loader2 className="size-4 text-warning" />} label="Processing" value={processing} />
            <StatCard icon={<HardDrive className="size-4 text-primary" />} label="Storage used" value="3.8 GB" />
          </div>

          {/* collection tabs */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {COLLECTIONS.map((c) => {
              const Icon = c.icon;
              const active = collection === c.id;
              const count = SLIDE_LIST.filter((s) => s.collection === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCollection(c.id)}
                  className={cn(
                    "card-hover flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    active
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-surface/50 hover:bg-surface-hover"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      active ? "brand-gradient text-white" : "bg-surface-muted text-muted"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {c.label}
                      <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] tabular text-muted">
                        {count}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">{c.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Slides</div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] text-muted">
                <Search className="size-3.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search slides…"
                  className="w-40 bg-transparent outline-none placeholder:text-muted/60"
                />
              </div>
            </div>

            {/* head */}
            <div className="grid grid-cols-[1.6fr_1fr_0.8fr_0.9fr_1fr_auto] gap-3 border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
              <span>Name</span>
              <span>Specimen</span>
              <span>Size</span>
              <span>Status</span>
              <span>Updated</span>
              <span></span>
            </div>

            {/* rows */}
            {rows.length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-muted">No slides found.</div>
            )}
            {rows.map((s) => (
              <Link
                key={s.id}
                href="/viewer"
                className="grid grid-cols-[1.6fr_1fr_0.8fr_0.9fr_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-3 text-xs transition-colors last:border-0 hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                    <Layers className="size-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="truncate font-mono text-[10px] text-muted">{s.id}</div>
                  </div>
                </div>
                <div className="text-muted">
                  {s.organ} · {s.stain}
                </div>
                <div className="tabular text-muted">{(s.sizeMB / 1024).toFixed(2)} GB</div>
                <div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="tabular text-muted">{s.updated}</div>
                <ChevronRight className="size-4 text-muted/50" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card-hover rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SlideRow["status"] }) {
  if (status === "Analyzed")
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3" /> Analyzed
      </Badge>
    );
  if (status === "Processing")
    return (
      <Badge variant="warning">
        <Loader2 className="size-3 animate-spin" /> Processing
      </Badge>
    );
  return (
    <Badge variant="outline">
      <Clock className="size-3" /> Pending
    </Badge>
  );
}
