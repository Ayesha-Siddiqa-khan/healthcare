"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";
type Preferences = { theme: Theme; compact: boolean };
const KEY = "healthcare.preferences.v1";
const DEFAULT = JSON.stringify({ theme: "system", compact: false });
const EVENT = "healthcare-preferences";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function snapshot() {
  try { return localStorage.getItem(KEY) ?? DEFAULT; } catch { return DEFAULT; }
}

function parse(value: string): Preferences {
  try {
    const data = JSON.parse(value);
    return {
      theme: ["light", "dark", "system"].includes(data?.theme) ? data.theme : "system",
      compact: data?.compact === true,
    };
  } catch { return { theme: "system", compact: false }; }
}

const PreferenceContext = createContext<{
  preferences: Preferences;
  update: (next: Partial<Preferences>) => void;
  storageError: boolean;
} | null>(null);

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, snapshot, () => DEFAULT);
  const [temporary, setTemporary] = useState<Preferences | null>(null);
  const preferences = temporary ?? parse(stored);
  const { theme, compact } = preferences;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.compact = String(compact);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, compact]);

  function update(next: Partial<Preferences>) {
    const merged = { ...preferences, ...next };
    try {
      localStorage.setItem(KEY, JSON.stringify(merged));
      setTemporary(null);
      window.dispatchEvent(new Event(EVENT));
    } catch { setTemporary(merged); }
  }

  return <PreferenceContext value={{ preferences, update, storageError: temporary !== null }}>{children}</PreferenceContext>;
}

export function usePreferences() {
  const value = useContext(PreferenceContext);
  if (!value) throw new Error("PreferenceProvider is required.");
  return value;
}

