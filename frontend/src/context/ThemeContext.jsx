import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyThemeClass(theme) {
  const root = document.documentElement; // <html>
  const finalTheme = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", finalTheme === "dark");
}

export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return defaultTheme;
    return localStorage.getItem(THEME_KEY) || defaultTheme;
  });

  // keep in sync with <html> and system changes if "system"
  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyThemeClass("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,                       // 'light' | 'dark' | 'system'
      setTheme,                    // setter
      resolvedTheme:
        theme === "system" ? getSystemTheme() : theme, // actual in-use theme
      toggle() {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
      },
      setSystem() {
        setTheme("system");
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
