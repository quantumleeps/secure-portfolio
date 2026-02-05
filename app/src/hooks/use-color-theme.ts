"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "color-theme";
export const COLOR_THEMES = ["zinc", "blue", "rose", "green", "violet"] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

const RANDOM_POOL: ColorTheme[] = ["zinc", "blue", "green", "violet"];

function getStoredTheme(): ColorTheme {
  if (typeof window === "undefined") return "zinc";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (COLOR_THEMES.includes(stored as ColorTheme)) return stored as ColorTheme;
  const picked = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  localStorage.setItem(STORAGE_KEY, picked);
  return picked;
}

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(getStoredTheme);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (theme === "zinc") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored !== "zinc") {
      document.documentElement.setAttribute("data-theme", stored);
    }
    setColorThemeState(stored);
  }, []);

  return { colorTheme, setColorTheme, themes: COLOR_THEMES } as const;
}
