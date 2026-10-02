import type { CaseData } from "./mock-data";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[]; // which deterministic tool/number grounds the answer
}

// Minimal-agent assistant: it NEVER invents clinical numbers. It only phrases
// values already computed by the quantitative models, and always cites them.
// (Mirrors TissueLab's principle: the LLM orchestrates/summarizes, models decide.)
export function respond(text: string, c: CaseData): Omit<ChatMessage, "role"> {
  const q = text.toLowerCase();

  const tumorCells = c.cells.types.find((t) => t.name === "Tumor")?.count ?? 0;
  const lymph = c.cells.types.find((t) => t.name === "Lymphocyte")?.count ?? 0;

  if (q.includes("ratio") || (q.includes("tumor") && q.includes("lympho"))) {
    const ratio = (tumorCells / lymph).toFixed(2);
    return {
      content: `The tumor-to-lymphocyte ratio is ${ratio} (${tumorCells.toLocaleString()} tumor cells vs ${lymph.toLocaleString()} lymphocytes). Dense peritumoral lymphocytic infiltration is present.`,
      sources: ["HoVer-Net cell counts"],
    };
  }

  if (q.includes("stag") || q.includes("t2") || q.includes("why")) {
    return {
      content: `Staged ${c.staging.stage} (${Math.round(
        c.staging.confidence * 100
      )}% confidence). ${c.staging.guideline.rationale} Reference: ${c.staging.guideline.system}.`,
      sources: ["CLAM-MIL staging", c.staging.guideline.system],
    };
  }

  if (q.includes("surviv") || q.includes("outlook") || q.includes("prognos")) {
    return {
      content: `Predicted ${c.survival.risk.toLowerCase()} risk group with an estimated median survival of ${c.survival.medianMonths} months. The survival curve declines to ~${Math.round(
        c.survival.curve[c.survival.curve.length - 1].survival * 100
      )}% by month ${c.survival.curve[c.survival.curve.length - 1].month}.`,
      sources: ["MCAT survival model"],
    };
  }

  if (q.includes("reliab") || q.includes("quality") || q.includes("qc") || q.includes("ood")) {
    const failing = c.qc.checks.filter((x) => x.status !== "pass");
    return {
      content: c.qc.ood
        ? `This slide is flagged out-of-distribution (OOD score ${c.qc.oodScore.toFixed(
            2
          )}). Results may be unreliable — pathologist review recommended.`
        : `The slide passed quality control (OOD score ${c.qc.oodScore.toFixed(2)}, in-distribution). ${
            failing.length
              ? `${failing.length} check(s) raised a soft warning but remain within tolerance.`
              : "All QC checks passed."
          }`,
      sources: ["QC / OOD module"],
    };
  }

  if (q.includes("tissue") || q.includes("composition") || q.includes("tumor")) {
    return {
      content: `Tissue composition: ${c.tissue.tumor}% tumor, ${c.tissue.stroma}% stroma, ${c.tissue.necrosis}% necrosis, ${c.tissue.normal}% normal.`,
      sources: ["Tissue segmentation"],
    };
  }

  if (q.includes("diagnos") || q.includes("what") && q.includes("this")) {
    return {
      content: `Primary diagnosis: ${c.diagnosis.label} (${c.diagnosis.severity}, ${Math.round(
        c.diagnosis.confidence * 100
      )}% confidence).`,
      sources: ["Diagnosis classifier"],
    };
  }

  return {
    content:
      "I can summarize the model outputs for this slide — try asking about the diagnosis, tissue composition, cell counts, staging rationale, survival outlook, or slide quality. I only report values the analysis models computed.",
  };
}
