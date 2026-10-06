"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { UploadCloud, X, FileImage, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { TILE_API } from "@/lib/config";
import type { SlideRow } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "done" | "error";

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const addSlide = useStore((s) => s.addSlide);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const [fileName, setFileName] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState("");

  // reset when reopened
  React.useEffect(() => {
    if (open) {
      setPhase("idle");
      setProgress(0);
      setFileName("");
      setDragging(false);
      setError("");
    }
  }, [open]);

  const finish = () => {
    setProgress(100);
    setPhase("done");
    setTimeout(onClose, 1000);
  };

  const startUpload = (file: File) => {
    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);

    const today = new Date().toISOString().slice(0, 10);
    const sizeMB = Math.max(1, Math.round(file.size / (1024 * 1024)));

    // Real upload to the tile server (streams the file, then it's viewable).
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${TILE_API}/api/slides`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          addSlide({
            id: res.id,
            name: res.name ?? file.name,
            organ: t("Unclassified"),
            stain: "H&E",
            sizeMB: res.sizeMB ?? sizeMB,
            status: "Pending",
            updated: today,
            collection: "personal",
          });
          finish();
          return;
        } catch {
          /* fall through to error */
        }
      }
      // server reachable but rejected the file
      let detail = `${xhr.status}`;
      try {
        detail = JSON.parse(xhr.responseText).detail ?? detail;
      } catch {}
      setError(String(detail));
      setPhase("error");
    };
    // server unreachable → pure-frontend demo fallback (adds a local entry)
    xhr.onerror = () => {
      addSlide({
        id: `UP-${Date.now().toString(36).toUpperCase()}`,
        name: file.name,
        organ: t("Unclassified"),
        stain: "H&E",
        sizeMB,
        status: "Processing",
        updated: today,
        collection: "personal",
      });
      finish();
    };

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  };

  const onFiles = (files: FileList | null) => {
    if (files && files.length) startUpload(files[0]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UploadCloud className="size-4" />
                </div>
                <span className="text-sm font-semibold">{t("Upload slide")}</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-hover cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5">
              {phase === "idle" && (
                <>
                  <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      onFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                      dragging
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface/40 hover:border-primary/50 hover:bg-surface-hover"
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UploadCloud className="size-6" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t("Drag & drop a slide here")}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        {t("or click to browse files")}
                      </div>
                    </div>
                    <div className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-[10px] text-muted">
                      .svs · .ndpi · .tiff · .mrxs
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".svs,.ndpi,.mrxs,.tif,.tiff"
                    className="hidden"
                    onChange={(e) => onFiles(e.target.files)}
                  />
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
                    {t("Demo upload — the slide is added to your library without leaving the browser.")}
                  </p>
                </>
              )}

              {(phase === "uploading" || phase === "done") && (
                <div className="py-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-primary">
                      <FileImage className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{fileName}</div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full brand-gradient transition-all duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-14 text-right">
                      {phase === "done" ? (
                        <CheckCircle2 className="ml-auto size-5 text-success" />
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs font-semibold tabular text-primary">
                          <Loader2 className="size-3 animate-spin" />
                          {progress}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-muted">
                    {phase === "done" ? t("Upload complete — added to your library.") : t("Uploading…")}
                  </p>
                </div>
              )}

              {phase === "error" && (
                <div className="py-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div className="mt-3 text-sm font-medium">{t("Upload failed")}</div>
                  <div className="mt-1 break-words text-[11px] text-muted">{error}</div>
                  <button
                    onClick={() => setPhase("idle")}
                    className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs text-foreground hover:bg-surface-hover cursor-pointer"
                  >
                    {t("Try again")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
