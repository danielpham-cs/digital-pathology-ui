import type { CaseData } from "./mock-data";
import { translate, type Locale } from "./translations";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  question?: string;
  caseSnapshot?: CaseData;
}

// Demo assistant: bilingual keyword routing over existing mock values.
export function respond(text: string, c: CaseData, locale: Locale = "en"): Omit<ChatMessage, "role"> {
  const q = text.toLowerCase();
  const zh = locale === "zh-TW";
  const t = (value: string) => translate(value, locale);
  const has = (...words: string[]) => words.some(word => q.includes(word));
  const tumorCells = c.cells.types.find(cell => cell.name === "Tumor")?.count ?? 0;
  const lymph = c.cells.types.find(cell => cell.name === "Lymphocyte")?.count ?? 0;
  const count = (value: number) => value.toLocaleString(locale);
  if (has("ratio", "比例", "比率") || (has("tumor", "腫瘤") && has("lympho", "淋巴"))) {
    const ratio = lymph ? (tumorCells / lymph).toFixed(2) : "—";
    return { content: zh ? `腫瘤細胞與淋巴球的比例為 ${ratio}（${count(tumorCells)} 個腫瘤細胞、${count(lymph)} 個淋巴球）。可見密集的腫瘤周邊淋巴球浸潤。` : `The tumor-to-lymphocyte ratio is ${ratio} (${count(tumorCells)} tumor cells vs ${count(lymph)} lymphocytes). Dense peritumoral lymphocytic infiltration is present.`, sources: ["HoVer-Net cell counts"] };
  }
  if (has("stag", "t2", "why", "分期", "為什麼")) {
    return { content: zh ? `分期為 ${c.staging.stage}（信心值 ${Math.round(c.staging.confidence * 100)}%）。${t(c.staging.guideline.rationale)}參考：${t(c.staging.guideline.system)}。` : `Staged ${c.staging.stage} (${Math.round(c.staging.confidence * 100)}% confidence). ${c.staging.guideline.rationale} Reference: ${c.staging.guideline.system}.`, sources: ["CLAM-MIL staging", c.staging.guideline.system] };
  }
  if (has("surviv", "outlook", "prognos", "生存", "預後")) {
    const last = c.survival.curve[c.survival.curve.length - 1];
    return { content: zh ? `預測為${t(c.survival.risk)}風險群組，估計中位生存時間為 ${c.survival.medianMonths} 個月。生存曲線於第 ${last.month} 個月下降至約 ${Math.round(last.survival * 100)}%。` : `Predicted ${c.survival.risk.toLowerCase()} risk group with an estimated median survival of ${c.survival.medianMonths} months. The survival curve declines to ~${Math.round(last.survival * 100)}% by month ${last.month}.`, sources: ["MCAT survival model"] };
  }
  if (has("reliab", "quality", "qc", "ood", "品質", "可靠", "異常")) {
    const warnings = c.qc.checks.filter(check => check.status !== "pass").length;
    return { content: c.qc.ood
      ? (zh ? `這張切片被標記為分布外（OOD 分數 ${c.qc.oodScore.toFixed(2)}）。結果可能不可靠，建議由病理醫師覆核。` : `This slide is flagged out-of-distribution (OOD score ${c.qc.oodScore.toFixed(2)}). Results may be unreliable — pathologist review recommended.`)
      : (zh ? `切片通過品質控制（OOD 分數 ${c.qc.oodScore.toFixed(2)}，分布內）。${warnings ? `${warnings} 項檢查提出輕度警告，但仍在容許範圍內。` : "所有品質檢查均通過。"}` : `The slide passed quality control (OOD score ${c.qc.oodScore.toFixed(2)}, in-distribution). ${warnings ? `${warnings} check(s) raised a soft warning but remain within tolerance.` : "All QC checks passed."}`), sources: ["QC / OOD module"] };
  }
  if (has("cell", "細胞", "淋巴")) {
    return { content: zh ? `細胞總數為 ${count(c.cells.total)}，密度為每平方毫米 ${count(c.cells.densityPerMm2)} 個。${c.cells.types.map(cell => `${t(cell.name)}：${count(cell.count)}`).join("；")}。` : `Total cells: ${count(c.cells.total)}; density: ${count(c.cells.densityPerMm2)} /mm². ${c.cells.types.map(cell => `${cell.name}: ${count(cell.count)}`).join("; ")}.`, sources: ["HoVer-Net cell counts"] };
  }
  if (has("tissue", "composition", "tumor", "組織", "腫瘤")) {
    return { content: zh ? `組織組成：腫瘤 ${c.tissue.tumor}%、間質 ${c.tissue.stroma}%、壞死 ${c.tissue.necrosis}%、正常組織 ${c.tissue.normal}%。` : `Tissue composition: ${c.tissue.tumor}% tumor, ${c.tissue.stroma}% stroma, ${c.tissue.necrosis}% necrosis, ${c.tissue.normal}% normal.`, sources: ["Tissue segmentation"] };
  }
  if (has("diagnos", "診斷") || (has("what", "什麼") && has("this", "這"))) {
    return { content: zh ? `主要診斷：${t(c.diagnosis.label)}（${t(c.diagnosis.severity === "malignant" ? "Malignant" : c.diagnosis.severity === "benign" ? "Benign" : "Uncertain")}，信心值 ${Math.round(c.diagnosis.confidence * 100)}%）。` : `Primary diagnosis: ${c.diagnosis.label} (${c.diagnosis.severity}, ${Math.round(c.diagnosis.confidence * 100)}% confidence).`, sources: ["Diagnosis classifier"] };
  }
  return { content: zh ? "我可以摘要這張切片的模擬分析結果。請詢問診斷、組織組成、細胞計數、分期依據、生存預後或切片品質；我只會回報既有資料中的數值。" : "I can summarize the model outputs for this slide — try asking about the diagnosis, tissue composition, cell counts, staging rationale, survival outlook, or slide quality. I only report values the analysis models computed." };
}
