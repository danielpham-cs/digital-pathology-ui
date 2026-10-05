"use client";

import Link from "next/link";
import {
  ScanSearch,
  Layers,
  Activity,
  ShieldCheck,
  FileText,
  ArrowRight,
  Code2,
  Sparkles,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import { PixelLogo } from "@/components/shell/pixel-logo";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Gigapixel WSI Viewer",
    desc: "Smooth deep-zoom over whole-slide images with toggleable tissue, cell and attention overlays.",
    tag: "OpenSeadragon",
  },
  {
    icon: Layers,
    title: "Tissue & Cell Segmentation",
    desc: "Automatic tissue maps and per-cell detection, separating tumor, stroma, necrosis and lymphocytes.",
    tag: "SAM-Path · HoVer-Net",
  },
  {
    icon: Activity,
    title: "Staging & Survival",
    desc: "MIL-based tumor staging grounded in AJCC guidelines, plus quantitative survival risk modeling.",
    tag: "CLAM-MIL · MCAT",
  },
  {
    icon: ShieldCheck,
    title: "Out-of-Distribution QC",
    desc: "Flags blurry, low-tissue or off-distribution slides before inference, so you trust every result.",
    tag: "OOD detection",
  },
  {
    icon: FileText,
    title: "Structured Reports",
    desc: "One-click A4 pathology report with findings, charts and guideline citations — ready to export.",
    tag: "PDF export",
  },
  {
    icon: Sparkles,
    title: "Minimal-Agent Assistant",
    desc: "An LLM that only orchestrates and summarizes. Every clinical number comes from a dedicated model.",
    tag: "Grounded AI",
  },
];

const STEPS = [
  { n: "01", title: "Load slide", desc: "Import a TCGA whole-slide image into the viewer." },
  { n: "02", title: "Run the DAG", desc: "Deterministic models execute as a workflow graph — tissue, cells, staging, survival." },
  { n: "03", title: "Review & refine", desc: "Inspect results, correct with feedback, and export a grounded report." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <PixelLogo size={26} />
            <span className="font-display text-[15px] font-bold tracking-tight">
              Pathology<span className="gradient-text">AI</span>
            </span>
          </div>
          <nav className="hidden items-center gap-7 text-[13px] text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
            <a href="#principle" className="transition-colors hover:text-foreground">Principle</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="mr-1" />
            <Button variant="outline" size="sm">
              <Code2 /> GitHub
            </Button>
            <Link href="/dashboard">
              <Button size="sm">
                Launch Platform <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-20 text-center">
          <div className="fade-up">
            <Badge variant="primary" className="mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Research platform · Powered by TCGA
            </Badge>
            <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              Computational pathology,
              <br />
              <span className="gradient-text">grounded in your models.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              Turn whole-slide images into tissue segmentation, staging, survival estimates and
              structured reports — driven by deterministic AI models, not a black-box agent.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="shine">
                  Launch Platform <ArrowRight />
                </Button>
              </Link>
              <Link href="/viewer">
                <Button variant="outline" size="lg">
                  <ScanSearch /> View demo viewer
                </Button>
              </Link>
            </div>
          </div>

          {/* Product preview mock */}
          <div className="fade-up-delay relative mx-auto mt-14 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface/60 shadow-lg backdrop-blur">
              {/* faux window bar */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-[11px] text-muted">app · TCGA-A7-A0CE-01Z</span>
              </div>
              {/* faux workspace */}
              <div className="relative grid grid-cols-[1fr_200px] gap-3 bg-viewer p-3">
                {/* viewer swatch */}
                <div
                  className="relative h-56 overflow-hidden rounded-lg"
                  style={{
                    background:
                      "radial-gradient(120px 90px at 30% 40%, rgba(244,63,94,0.35), transparent 60%), radial-gradient(140px 100px at 70% 65%, rgba(168,85,247,0.3), transparent 60%), linear-gradient(135deg,#f3dbe6,#e9c4d8)",
                  }}
                >
                  <div className="absolute left-3 top-3 rounded-md glass px-2 py-1 text-[9px] text-foreground">
                    Tissue · Cells · Attention
                  </div>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full glass px-2 py-1 text-[9px] text-foreground">
                    2× 10× 20× 40×
                  </div>
                </div>
                {/* results swatch */}
                <div className="space-y-2">
                  <div className="rounded-lg brand-gradient p-2.5 text-left">
                    <div className="text-[8px] uppercase text-white/70">Diagnosis</div>
                    <div className="text-[11px] font-bold text-white">Invasive ductal carcinoma</div>
                    <div className="mt-1 text-[8px] text-white/80">91% confidence</div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5 text-left">
                    <div className="text-[8px] uppercase text-muted">Staging</div>
                    <div className="gradient-text text-lg font-bold">T2</div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-2.5 text-left">
                    <div className="text-[8px] uppercase text-muted">Risk</div>
                    <div className="text-[11px] font-semibold text-warning">Intermediate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1120px] px-6 py-20">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything from pixels to report"
          sub="Six dedicated modules compose into one end-to-end pathology workflow."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card-hover rounded-xl border border-border bg-surface/50 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.desc}</p>
                <div className="mt-3 inline-block rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-muted">
                  {f.tag}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-[1120px] px-6 py-20">
          <SectionHeading
            eyebrow="Workflow"
            title="A deterministic pipeline, not a prompt"
            sub="Models run as a directed graph. Each node is a dedicated tool with a verifiable output."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-surface/50 p-6">
                <div className="flex items-center gap-2 text-primary">
                  <GitBranch className="size-4" />
                  <span className="font-mono text-xs">{s.n}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principle */}
      <section id="principle" className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-2/20 blur-[100px]" />
          <div className="relative max-w-2xl">
            <Badge variant="primary">Minimal-agent by design</Badge>
            <h2 className="font-display mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              The models decide. The agent only{" "}
              <span className="gradient-text">orchestrates.</span>
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Clinical numbers come from quantitative, peer-reviewed models — segmentation, MIL
              staging, survival. The language model never touches pixels or invents a diagnosis; it
              plans the workflow and writes the final summary, every claim traced to a model output
              or a clinical guideline.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Staging grounded in AJCC / CAP / WHO criteria",
                "Every result overlaid on the original slide",
                "Human-in-the-loop refinement in seconds",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[13px]">
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="shine">
                  Open the platform <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted md:flex-row">
          <div className="flex items-center gap-2.5">
            <PixelLogo size={20} />
            <span className="font-display font-semibold text-foreground">PathologyAI</span>
            <span className="ml-2">Research use only. Not a medical device.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-foreground">GitHub</a>
            <a href="#" className="transition-colors hover:text-foreground">TCGA</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>
      <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{sub}</p>
    </div>
  );
}
