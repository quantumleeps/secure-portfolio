"use client";

import { useEffect } from "react";
import type { Slide } from "@/lib/types";

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function usePrefetchImages(slides: Slide[]) {
  useEffect(() => {
    let cancelled = false;

    async function prefetch() {
      for (const slide of slides) {
        for (const img of slide.images) {
          if (cancelled) return;
          if (img.src) await loadImage(img.src);
        }
      }
    }

    prefetch();
    return () => {
      cancelled = true;
    };
  }, [slides]);
}
