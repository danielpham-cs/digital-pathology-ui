"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      role="group"
      aria-label={locale === "zh-TW" ? "介面語言" : "Interface language"}
      className={cn("flex rounded-lg border border-border p-0.5", className)}
    >
      {(["zh-TW", "en"] as const).map((language) => (
        <button
          key={language}
          type="button"
          aria-pressed={locale === language}
          onClick={() => setLocale(language)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
            locale === language
              ? "brand-gradient text-white"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          )}
        >
          {language === "zh-TW" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}
