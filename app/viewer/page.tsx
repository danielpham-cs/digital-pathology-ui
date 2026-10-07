"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/shell/sidebar";
import { CommandBar } from "@/components/workspace/command-bar";
import { LayersFloat } from "@/components/workspace/layers-float";
import { ResultsFloat } from "@/components/workspace/results-float";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useStore } from "@/lib/store";

// OpenSeadragon touches the DOM — load the viewer client-side only.
const WSIViewer = dynamic(
  () => import("@/components/viewer/wsi-viewer").then((m) => m.WSIViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-viewer text-xs text-white/50">
        Loading slide…
      </div>
    ),
  }
);

// Reads ?slide=<id> and remounts the viewer (via key) when it changes, so
// switching slides cleanly reloads — even on Next's cached client navigation.
function ViewerCanvas() {
  const slideId = useSearchParams().get("slide");
  const resetAnalysis = useStore((s) => s.resetAnalysis);
  useEffect(() => {
    resetAnalysis(); // a new slide has no analysis yet
  }, [slideId, resetAnalysis]);
  return <WSIViewer key={slideId ?? "default"} slideId={slideId} />;
}

export default function ViewerPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active="viewer" />

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={<div className="h-full w-full bg-viewer" />}>
            <ViewerCanvas />
          </Suspense>
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 z-20">
          <CommandBar />
        </div>

        <div className="pointer-events-none absolute left-4 top-[76px] z-20">
          <LayersFloat />
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 top-[76px] z-20 flex">
          <ResultsFloat />
        </div>

        <ChatPanel />
      </main>
    </div>
  );
}
