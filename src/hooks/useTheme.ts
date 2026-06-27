import React from "react";

const THEME_KEY = "theme";

export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
}

export function initThemeFromStorage() {
  applyTheme(getStoredTheme() === "dark");
}

export function useTheme() {
  const [isDark, setIsDark] = React.useState(() => getStoredTheme() === "dark");

  React.useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const setDark = React.useCallback((dark: boolean) => {
    applyTheme(dark);
    setIsDark(dark);
  }, []);

  const toggle = React.useCallback(() => {
    setDark(!document.documentElement.classList.contains("dark"));
  }, [setDark]);

  return { isDark, setDark, toggle };
}
