"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/dashboard/settings-form";

const STORAGE_KEY = "cf-theme";

/** Applies/removes the `.dark` class on <html> and persists to localStorage. */
function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {}
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initial = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark") initial = true;
      else if (saved === "light") initial = false;
      else
        initial = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {}
    setDark(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-medium">
          {dark ? (
            <Moon className="h-4 w-4 text-brand-500" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          {dark ? "Dark mode" : "Light mode"}
        </div>
        <p className="text-sm text-muted">
          {mounted
            ? `Currently using ${dark ? "dark" : "light"} theme.`
            : "Loading…"}
        </p>
      </div>
      {mounted && <Toggle on={dark} onChange={toggle} />}
    </div>
  );
}

/** Runs early before React hydration to prevent flash of wrong theme. */
export function ThemeScript() {
  const code = `
    (function() {
      try {
        var saved = localStorage.getItem('${STORAGE_KEY}');
        var dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
