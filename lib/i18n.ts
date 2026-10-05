"use client";
import { useSyncExternalStore } from "react";
import { translate, type Locale } from "./translations";
const key = "pathologyai-language";
let fallbackLocale: Locale = "zh-TW";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
function snapshot(): Locale {
  try { return localStorage.getItem(key) === "en" ? "en" : "zh-TW"; }
  catch { return fallbackLocale; }
}
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, snapshot, () => "zh-TW" as Locale);
  return {
    locale,
    t: (text: string) => translate(text, locale),
    setLocale: (value: Locale) => {
      fallbackLocale = value;
      try { localStorage.setItem(key, value); } catch {}
      listeners.forEach(listener => listener());
    },
  };
}
