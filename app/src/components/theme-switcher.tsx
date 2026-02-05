"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Palette, X } from "lucide-react";
import { useColorTheme } from "@/hooks/use-color-theme";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE_COLORS: Record<string, { dot: string; label: string }> = {
  zinc: { dot: "bg-zinc-500", label: "Zinc" },
  blue: { dot: "bg-blue-500", label: "Blue" },
  rose: { dot: "bg-rose-500", label: "Rose" },
  green: { dot: "bg-green-500", label: "Green" },
  violet: { dot: "bg-violet-500", label: "Violet" },
};

const AUTO_CLOSE_MS = 5000;

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, themes } = useColorTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startTimer = useCallback(
    (ms: number) => {
      clearTimer();
      timeoutRef.current = setTimeout(() => setIsOpen(false), ms);
    },
    [clearTimer]
  );

  // Start idle timer when opened, clear when closed
  useEffect(() => {
    if (isOpen) {
      startTimer(AUTO_CLOSE_MS);
    } else {
      clearTimer();
    }
  }, [isOpen, startTimer, clearTimer]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleColorClick = useCallback(
    (t: (typeof themes)[number]) => {
      setColorTheme(t);
      startTimer(AUTO_CLOSE_MS);
    },
    [setColorTheme, startTimer]
  );

  const handleModeClick = useCallback(() => {
    const modes = ["dark", "light", "system"] as const;
    const currentIdx = modes.indexOf(theme as (typeof modes)[number]);
    setTheme(modes[(currentIdx + 1) % modes.length]);
    startTimer(AUTO_CLOSE_MS);
  }, [theme, setTheme, startTimer]);

  if (!mounted) return null;

  const ModeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50">
      {/* Collapsed: palette icon */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open theme switcher"
          className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
        >
          <Palette className="size-4" />
        </Button>
      </div>

      {/* Expanded: color dots + mode toggle */}
      <div
        className={cn(
          "absolute bottom-0 right-0 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out origin-right",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleModeClick}
          aria-label={`Current mode: ${theme}. Click to cycle.`}
        >
          <ModeIcon className="size-3.5" />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => handleColorClick(t)}
            aria-label={`${PALETTE_COLORS[t].label} theme`}
            className={cn(
              "size-4 rounded-full transition-all",
              PALETTE_COLORS[t].dot,
              colorTheme === t
                ? "ring-2 ring-ring ring-offset-2 ring-offset-background scale-110"
                : "opacity-60 hover:opacity-100 hover:scale-110"
            )}
          />
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close theme switcher"
          className="flex items-center justify-center size-5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
