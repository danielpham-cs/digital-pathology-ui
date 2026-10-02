# PathologyAI — Digital Pathology Workspace

AI-assisted whole-slide image (WSI) analysis UI for digital pathology. A professional,
demo-ready frontend that renders WSIs, runs a deterministic analysis pipeline, and reports
tissue/cell segmentation, tumor staging, survival estimates, QC/OOD flags, and an
AI-generated summary.

Built for a hackathon demo — the entire app runs **offline on mock data** with a
**synthetic H&E slide** generated client-side, so no backend or GPU is required to demo.

## Design principles

- **Minimal-agent** — the LLM only orchestrates and summarizes; every clinical number comes
  from dedicated quantitative models. Staging is grounded in clinical guidelines (AJCC), not
  free-form model reasoning.
- **Transparent workflow** — the pipeline is shown as a DAG of named tools (tiffslide, SAM-Path,
  UNI, HoVer-Net, CLAM-MIL, MCAT).
- **Human-in-the-loop** — feedback + active-learning refine controls mirror a co-evolution loop.

## Features

- **WSI viewer** (OpenSeadragon) with deep zoom/pan, navigator minimap, scale bar, and toggleable
  overlay layers: tissue mask, cell detection, attention heatmap (per-layer opacity).
- **Analysis pipeline** visualized as an animated **workflow DAG**.
- **Results panel** — diagnosis, tissue composition (donut), cell distribution, staging stepper
  with **AJCC guideline grounding**, Kaplan-Meier survival curve, QC/OOD checklist.
- **Slide assistant** — a minimal-agent chat that answers only from computed model outputs, with
  source citations.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · OpenSeadragon · Recharts ·
Motion · Zustand · lucide-react. UI primitives are hand-rolled in `components/ui/`.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

Click **Run analysis** to watch the pipeline execute, open the **Staging** tab for the guideline
grounding + refine control, and use **Ask AI** (bottom-left) to query the slide.

## Project structure

```
app/                   layout, page (Case Workspace), globals.css (medical design tokens)
lib/                   mock-data (the backend contract), store (zustand), assistant, synthetic-slide
components/ui/          button, card, badge, tabs
components/layout/      top-bar, left-panel, right-panel, bottom-bar
components/viewer/      wsi-viewer (OpenSeadragon + SVG overlays)
components/analysis/    charts, workflow-dag
components/chat/        chat-panel (slide assistant)
```

## Wiring a real backend

The app is intentionally decoupled from any backend:

- Replace `tileSources` in `components/viewer/wsi-viewer.tsx` with a real TCGA DZI / IIIF endpoint.
- Replace the simulated pipeline in `lib/store.ts` (`runAnalysis`) with live API calls.
- The shape in `lib/mock-data.ts` (`CaseData`) is the contract the backend should return.

> Research use only. Not a medical device.
