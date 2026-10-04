import type { Locale } from "./translations";
import { create } from "zustand";
import { MOCK_CASE, PIPELINE_STEPS, type CaseData } from "./mock-data";
import { respond, type ChatMessage } from "./assistant";

export type AnalysisStatus = "idle" | "running" | "done";
export type Vote = "up" | "down" | null;

export interface Layer {
  id: "tissue" | "cells" | "attention";
  label: string;
  enabled: boolean;
  opacity: number;
  color: string;
}

interface ViewerState {
  // current viewport readout (updated by the viewer)
  zoom: number;
  magnification: number;
  pointer: { x: number; y: number } | null;
  setViewport: (v: Partial<Pick<ViewerState, "zoom" | "magnification" | "pointer">>) => void;

  // layers
  layers: Layer[];
  toggleLayer: (id: Layer["id"]) => void;
  setLayerOpacity: (id: Layer["id"], opacity: number) => void;

  // analysis
  caseData: CaseData;
  status: AnalysisStatus;
  activeStep: number; // index into PIPELINE_STEPS, -1 when idle/done
  stepProgress: number; // 0..100 for the active step
  runAnalysis: () => void;
  resetAnalysis: () => void;

  // human-in-the-loop co-evolution
  diagnosisVote: Vote;
  refineRounds: number;
  setVote: (v: Vote) => void;
  refineStaging: () => void; // simulate active-learning: nudge confidence up

  // minimal-agent assistant
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatThinking: boolean;
  toggleChat: () => void;
  sendChat: (text: string, locale: Locale) => void;
}

export const useStore = create<ViewerState>((set, get) => ({
  zoom: 1,
  magnification: 1,
  pointer: null,
  setViewport: (v) => set(v),

  layers: [
    { id: "tissue", label: "Tissue mask", enabled: true, opacity: 55, color: "var(--danger)" },
    { id: "cells", label: "Cell detection", enabled: false, opacity: 80, color: "var(--primary)" },
    { id: "attention", label: "Attention heatmap", enabled: false, opacity: 65, color: "var(--warning)" },
  ],
  toggleLayer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)),
    })),
  setLayerOpacity: (id, opacity) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),

  caseData: MOCK_CASE,
  status: "idle",
  activeStep: -1,
  stepProgress: 0,

  runAnalysis: () => {
    if (get().status === "running") return;
    set({ status: "running", activeStep: 0, stepProgress: 0 });

    const total = PIPELINE_STEPS.length;
    const tick = () => {
      const { activeStep, stepProgress } = get();
      if (activeStep >= total) return;
      const next = stepProgress + 10 + Math.floor(Math.random() * 18);
      if (next >= 100) {
        if (activeStep + 1 >= total) {
          set({ status: "done", activeStep: total, stepProgress: 100 });
          return;
        }
        set({ activeStep: activeStep + 1, stepProgress: 0 });
      } else {
        set({ stepProgress: next });
      }
      setTimeout(tick, 180 + Math.random() * 160);
    };
    setTimeout(tick, 300);
  },

  resetAnalysis: () =>
    set({
      status: "idle",
      activeStep: -1,
      stepProgress: 0,
      diagnosisVote: null,
      refineRounds: 0,
      caseData: MOCK_CASE,
    }),

  diagnosisVote: null,
  refineRounds: 0,
  setVote: (v) => set((s) => ({ diagnosisVote: s.diagnosisVote === v ? null : v })),
  refineStaging: () =>
    set((s) => {
      const rounds = s.refineRounds + 1;
      const bumped = Math.min(0.99, s.caseData.staging.confidence + 0.04);
      return {
        refineRounds: rounds,
        caseData: {
          ...s.caseData,
          staging: {
            ...s.caseData.staging,
            confidence: bumped,
            note: `${s.caseData.staging.note} · refined ×${rounds} (active learning)`,
          },
        },
      };
    }),

  chatOpen: false,
  chatMessages: [],
  chatThinking: false,
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  sendChat: (text, locale) => {
    const t = text.trim();
    if (!t) return;
    set((s) => ({
      chatMessages: [...s.chatMessages, { role: "user", content: t }],
      chatThinking: true,
    }));
    const caseSnapshot = get().caseData;
    setTimeout(() => {
      const reply = respond(t, caseSnapshot, locale);
      set((s) => ({
        chatMessages: [...s.chatMessages, { role: "assistant", ...reply, question: t, caseSnapshot }],
        chatThinking: false,
      }));
    }, 550);
  },
}));
