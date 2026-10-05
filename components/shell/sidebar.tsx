"use client";

import Link from "next/link";
import { LayoutDashboard, ScanSearch, HardDrive, Settings } from "lucide-react";
import { PixelLogo } from "./pixel-logo";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { id: "viewer", icon: ScanSearch, label: "Image Viewer", href: "/viewer" },
];

export function Sidebar({ active }: { active: string }) {
  return (
    <nav className="glass z-30 flex w-[228px] shrink-0 flex-col border-r border-border">
      {/* brand → home */}
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg px-4 py-4 transition-opacity hover:opacity-80"
      >
        <PixelLogo size={26} />
        <span className="font-display text-[15px] font-bold tracking-tight">
          Pathology<span className="gradient-text">AI</span>
        </span>
      </Link>

      {/* nav */}
      <div className="flex-1 px-3 py-2">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
          Workspace
        </div>
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* cloud storage widget */}
      <div className="mx-3 mb-3 rounded-xl border border-border bg-surface/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted">
          <HardDrive className="size-3.5" />
          Cloud Storage
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-[38%] rounded-full brand-gradient" />
        </div>
        <div className="mt-1.5 text-[10px] tabular text-muted">3.8 GB of 10 GB used</div>
      </div>

      {/* user */}
      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-3 to-brand-2 text-[11px] font-semibold text-white">
          DP
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-xs font-medium">Daniel Pham</div>
          <div className="truncate text-[10px] text-muted">duong.pt1771@gmail.com</div>
        </div>
        <Settings className="size-4 text-muted" />
      </div>
    </nav>
  );
}
