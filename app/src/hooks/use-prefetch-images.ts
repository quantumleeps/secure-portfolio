"use client";

import { useEffect, useRef } from "react";
import type { Intro, Slide } from "@/lib/types";

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function useNeighborPrefetch(
  currentIndex: number,
  slides: Slide[],
  intro: Intro
) {
  const prefetchedUrls = useRef<Set<string>>(new Set());

  // Clear prefetched set when slides change (URL refresh gives new signed URLs)
  useEffect(() => {
    prefetchedUrls.current = new Set();
  }, [slides]);

  useEffect(() => {
    let cancelled = false;
    const totalSlides = slides.length + 1; // intro + projects
    const lo = Math.max(0, currentIndex - 1);
    const hi = Math.min(totalSlides - 1, currentIndex + 1);

    const urls: string[] = [];
    for (let i = lo; i <= hi; i++) {
      if (i === 0) {
        if (intro.avatar) urls.push(intro.avatar);
      } else {
        const slide = slides[i - 1];
        if (slide) {
          for (const img of slide.images) {
            if (img.src) urls.push(img.src);
          }
        }
      }
    }

    const newUrls = urls.filter((u) => !prefetchedUrls.current.has(u));
    for (const url of newUrls) {
      prefetchedUrls.current.add(url);
    }

    if (!cancelled && newUrls.length > 0) {
      Promise.allSettled(newUrls.map(loadImage));
    }

    return () => {
      cancelled = true;
    };
  }, [currentIndex, slides, intro]);
}
