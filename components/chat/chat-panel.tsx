"use client";

import { useI18n } from "@/lib/i18n";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { SUGGESTED_PROMPTS } from "@/lib/mock-data";
import { respond } from "@/lib/assistant";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { t, locale } = useI18n();
  const open = useStore((s) => s.chatOpen);
  const toggle = useStore((s) => s.toggleChat);
  const messages = useStore((s) => s.chatMessages);
  const thinking = useStore((s) => s.chatThinking);
  const send = useStore((s) => s.sendChat);
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const submit = (text: string) => {
    send(text, locale);
    setDraft("");
  };

  return (
    <>
      {/* launcher */}
      <button
        onClick={toggle}
        className={cn(
          "shine brand-gradient fixed bottom-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.04] cursor-pointer",
          open && "pointer-events-none opacity-0"
        )}
        style={{ left: 244 }}
      >
        <Sparkles className="size-4" />{t("Ask AI")}</button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass fixed bottom-20 left-1/2 z-40 flex h-[460px] w-[360px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{t("Slide Assistant")}</div>
                  <div className="text-[10px] text-muted">{t("Reports model outputs · doesn’t diagnose")}</div>
                </div>
              </div>
              <button
                aria-label={t("Close assistant")}
                onClick={toggle}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5 panel-scroll">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <MessageSquare className="size-7 text-muted/50" />
                  <p className="max-w-[240px] text-xs leading-relaxed text-muted">{t("Ask about this slide’s results. Answers are grounded in the quantitative models — the assistant never invents numbers.")}</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-muted text-foreground"
                    )}
                  >
                    <p>{m.role === "assistant" && m.question && m.caseSnapshot ? respond(m.question, m.caseSnapshot, locale).content : m.content}</p>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 border-t border-border/60 pt-1.5">
                        {(m.question && m.caseSnapshot ? respond(m.question, m.caseSnapshot, locale).sources ?? [] : m.sources).map((s) => (
                          <span
                            key={t(s)}
                            className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-medium text-muted"
                          >
                            {t(s)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface-muted px-3 py-2 text-xs text-muted">
                    <Loader2 className="size-3 animate-spin" />{t("Checking model outputs…")}</div>
                </div>
              )}
            </div>

            {/* suggestions */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={t(p)}
                    onClick={() => submit(t(p))}
                    className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted transition-colors hover:border-primary hover:text-primary cursor-pointer"
                  >
                    {t(p)}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft);
              }}
              className="flex items-center gap-2 border-t border-border p-2.5"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("Ask about this slide…")}
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
              />
              <button
                aria-label={t("Send message")}
                type="submit"
                disabled={!draft.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 cursor-pointer"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
