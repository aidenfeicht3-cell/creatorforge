"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/dashboard/settings-form";

const STORAGE_KEY = "cf-theme";

/**
 * Applies/removes the `.light` class on <html> and persists to localStorage.
 * Dark is the brand default (no class needed). `.light` is the override.
 */
function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  if (dark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {}
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Snipd brand defaults to dark. Light is an explicit opt-in via the
    // toggle. We only respect the system preference if the user has
    // never touched the toggle AND has explicitly set a light system theme.
    let initial = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light") initial = false;
      else if (saved === "dark") initial = true;
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

/** Runs early before React hydration to prevent flash of wrong theme.
 *  Dark is the brand default. Only flip to light if the user opted in. */
export function ThemeScript() {
  // Dark-only: force dark on every load and clear any stale light preference.
  // (Light theme retired per product decision.)
  const code = `
    (function() {
      try {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.removeItem('${STORAGE_KEY}');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
