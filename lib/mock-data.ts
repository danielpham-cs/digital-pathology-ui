// Mock analysis data modeled on a real digital-pathology pipeline.
// Replace these objects with live backend responses later — the shape is the contract.

export interface TissueComposition {
  tumor: number;
  stroma: number;
  necrosis: number;
  normal: number;
}

export interface CellType {
  name: string;
  count: number;
  color: string;
}

export interface SurvivalPoint {
  month: number;
  survival: number; // 0..1
}

export interface QCCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

// Clinical-standard grounding (AJCC/CAP/WHO). The staging number is produced by
// the quantitative MIL model; the guideline explains WHY that number maps to a
// stage — the LLM never invents staging, it only cites this reference.
export interface GuidelineReference {
  system: string; // e.g. "AJCC 8th edition"
  criteria: { stage: string; rule: string }[];
  matched: string; // which criterion the measurement satisfied
  rationale: string;
}

export interface CaseData {
  id: string;
  patient: string;
  organ: string;
  stain: string;
  source: string;
  magnification: string;
  mpp: number; // microns per pixel at base level
  diagnosis: {
    label: string;
    severity: "benign" | "malignant" | "uncertain";
    confidence: number;
  };
  tissue: TissueComposition;
  cells: {
    total: number;
    densityPerMm2: number;
    types: CellType[];
  };
  staging: {
    stage: "T1" | "T2" | "T3" | "T4";
    confidence: number;
    note: string;
    guideline: GuidelineReference;
  };
  survival: {
    risk: "Low" | "Intermediate" | "High";
    medianMonths: number;
    curve: SurvivalPoint[];
  };
  qc: {
    ood: boolean;
    oodScore: number; // 0..1, higher = more out-of-distribution
    checks: QCCheck[];
  };
  narrative: string;
}

export const MOCK_CASE: CaseData = {
  id: "TCGA-A7-A0CE-01Z",
  patient: "De-identified · 61 / F",
  organ: "Breast (BRCA)",
  stain: "H&E",
  source: "TCGA — The Cancer Genome Atlas",
  magnification: "40×",
  mpp: 0.25,
  diagnosis: {
    label: "Invasive ductal carcinoma",
    severity: "malignant",
    confidence: 0.91,
  },
  tissue: { tumor: 42, stroma: 31, necrosis: 9, normal: 18 },
  cells: {
    total: 48213,
    densityPerMm2: 6820,
    types: [
      { name: "Tumor", count: 21640, color: "var(--danger)" },
      { name: "Lymphocyte", count: 14120, color: "var(--primary)" },
      { name: "Stromal", count: 9330, color: "var(--teal)" },
      { name: "Other", count: 3123, color: "var(--muted)" },
    ],
  },
  staging: {
    stage: "T2",
    confidence: 0.87,
    note: "Measured tumor extent 31 mm; MIL aggregation over 4,210 patches.",
    guideline: {
      system: "AJCC 8th edition — Breast (primary tumor, T)",
      criteria: [
        { stage: "T1", rule: "Tumor ≤ 20 mm in greatest dimension" },
        { stage: "T2", rule: "Tumor > 20 mm and ≤ 50 mm" },
        { stage: "T3", rule: "Tumor > 50 mm" },
        { stage: "T4", rule: "Any size with chest wall / skin involvement" },
      ],
      matched: "T2",
      rationale:
        "Automated tumor extent of 31 mm falls in the > 20 mm and ≤ 50 mm range, satisfying the AJCC T2 criterion.",
    },
  },
  survival: {
    risk: "Intermediate",
    medianMonths: 58,
    curve: [
      { month: 0, survival: 1.0 },
      { month: 12, survival: 0.95 },
      { month: 24, survival: 0.88 },
      { month: 36, survival: 0.79 },
      { month: 48, survival: 0.68 },
      { month: 60, survival: 0.54 },
      { month: 72, survival: 0.43 },
      { month: 84, survival: 0.35 },
    ],
  },
  qc: {
    ood: false,
    oodScore: 0.18,
    checks: [
      { label: "Focus / sharpness", status: "pass", detail: "Laplacian variance 182 (> 120)" },
      { label: "Tissue coverage", status: "pass", detail: "71% of slide area" },
      { label: "Stain normalization", status: "pass", detail: "Macenko applied" },
      { label: "Distribution match", status: "warn", detail: "Mahalanobis 0.18 — within tolerance" },
    ],
  },
  narrative:
    "The specimen demonstrates an invasive ductal carcinoma with moderate nuclear pleomorphism and a tumor cellularity of approximately 42%. Dense lymphocytic infiltration is observed at the invasive margin. Automated staging estimates a T2 lesion (87% confidence). Quantitative survival modeling places the case in an intermediate risk group with an estimated median survival of 58 months. Findings are AI-assisted and require confirmation by a qualified pathologist.",
};

export const PIPELINE_STEPS = [
  "Loading slide",
  "Tissue segmentation",
  "Patch embedding",
  "Cell detection",
  "Staging (MIL)",
  "Survival analysis",
  "Generating report",
] as const;

// Workflow expressed as a DAG (like TissueLab): each node is a deterministic
// tool; `step` maps to the sequential PIPELINE_STEPS index so node status can be
// derived from the running pipeline. x/y are layout coords on a 316-wide canvas.
export interface DagNode {
  id: string;
  label: string;
  tool: string;
  step: number;
  x: number;
  y: number;
}

export const DAG_NODE_W = 134;
export const DAG_NODE_H = 42;
export const DAG_CANVAS_W = 316;
export const DAG_CANVAS_H = 430;

export const PIPELINE_DAG: { nodes: DagNode[]; edges: [string, string][] } = {
  nodes: [
    { id: "load", label: "Load slide", tool: "tiffslide", step: 0, x: 158, y: 26 },
    { id: "tissue", label: "Tissue seg.", tool: "SAM-Path", step: 1, x: 158, y: 92 },
    { id: "embed", label: "Patch embed", tool: "UNI", step: 2, x: 82, y: 164 },
    { id: "cells", label: "Cell detect", tool: "HoVer-Net", step: 3, x: 234, y: 164 },
    { id: "staging", label: "Staging", tool: "CLAM-MIL", step: 4, x: 82, y: 236 },
    { id: "survival", label: "Survival", tool: "MCAT", step: 5, x: 82, y: 308 },
    { id: "report", label: "Report", tool: "LLM", step: 6, x: 158, y: 380 },
  ],
  edges: [
    ["load", "tissue"],
    ["tissue", "embed"],
    ["tissue", "cells"],
    ["embed", "staging"],
    ["staging", "survival"],
    ["survival", "report"],
    ["cells", "report"],
  ],
};

// Slide library rows for the dashboard table.
export interface SlideRow {
  id: string;
  name: string;
  organ: string;
  stain: string;
  sizeMB: number;
  status: "Analyzed" | "Pending" | "Processing";
  updated: string;
  collection: "personal" | "shared" | "public";
}

export const SLIDE_LIST: SlideRow[] = [
  { id: "TCGA-A7-A0CE-01Z", name: "BRCA_A0CE_HE.svs", organ: "Breast", stain: "H&E", sizeMB: 842, status: "Analyzed", updated: "2026-09-28", collection: "personal" },
  { id: "TCGA-05-4384-01Z", name: "LUAD_4384_HE.svs", organ: "Lung", stain: "H&E", sizeMB: 1310, status: "Pending", updated: "2026-09-27", collection: "personal" },
  { id: "TCGA-AA-3524-01Z", name: "COAD_3524_HE.svs", organ: "Colon", stain: "H&E", sizeMB: 623, status: "Processing", updated: "2026-09-26", collection: "personal" },
  { id: "TCGA-CV-7416-01Z", name: "HNSC_7416_HE.svs", organ: "Head & Neck", stain: "H&E", sizeMB: 998, status: "Analyzed", updated: "2026-09-21", collection: "shared" },
  { id: "TCGA-DD-A113-01Z", name: "LIHC_A113_HE.svs", organ: "Liver", stain: "H&E", sizeMB: 1455, status: "Analyzed", updated: "2026-09-18", collection: "shared" },
  { id: "TCGA-OR-A5J1-01Z", name: "ACC_A5J1_HE.svs", organ: "Adrenal", stain: "H&E", sizeMB: 712, status: "Pending", updated: "2026-09-15", collection: "public" },
  { id: "TCGA-KK-A8IJ-01Z", name: "PRAD_A8IJ_HE.svs", organ: "Prostate", stain: "H&E", sizeMB: 889, status: "Analyzed", updated: "2026-09-12", collection: "public" },
];

export const SUGGESTED_PROMPTS = [
  "What is the tumor-to-lymphocyte ratio?",
  "Why was this staged as T2?",
  "Summarize the survival outlook",
  "Is this slide reliable for analysis?",
];
