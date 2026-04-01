"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "metrologia-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const nextTheme = getStoredTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function handleThemeChange(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage errors and keep the selected theme for the current session.
    }
  }

  return (
    <div
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Selecionar modo de exibicao"
    >
      <button
        type="button"
        className={`theme-toggle__button${theme === "light" ? " is-active" : ""}`}
        aria-pressed={theme === "light"}
        onClick={() => handleThemeChange("light")}
      >
        <span className="theme-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2.75v2.5M12 18.75v2.5M5.46 5.46l1.77 1.77M16.77 16.77l1.77 1.77M2.75 12h2.5M18.75 12h2.5M5.46 18.54l1.77-1.77M16.77 7.23l1.77-1.77"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>Claro</span>
      </button>

      <button
        type="button"
        className={`theme-toggle__button${theme === "dark" ? " is-active" : ""}`}
        aria-pressed={theme === "dark"}
        onClick={() => handleThemeChange("dark")}
      >
        <span className="theme-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M18.2 14.6A7.2 7.2 0 0 1 9.4 5.8a7.7 7.7 0 1 0 8.8 8.8Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>Escuro</span>
      </button>
    </div>
  );
}
