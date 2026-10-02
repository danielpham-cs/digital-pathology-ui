"use client";

import dynamic from "next/dynamic";
import { TopBar } from "@/components/layout/top-bar";
import { LeftPanel } from "@/components/layout/left-panel";
import { RightPanel } from "@/components/layout/right-panel";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ChatPanel } from "@/components/chat/chat-panel";

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

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="min-w-0 flex-1">
          <WSIViewer />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
      <ChatPanel />
    </div>
  );
}
