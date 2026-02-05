"use client";

import { useRef, useCallback } from "react";
import type { Intro, Slide } from "@/lib/types";

const DEBOUNCE_MS = 5_000; // minimum gap between refreshes to avoid rapid-fire on multiple image errors

export function useRefreshUrls(
  slug: string,
  visitId: string,
  onRefresh: (intro: Intro, slides: Slide[]) => void
) {
  const lastRefreshRef = useRef(0);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inflightRef.current) return;
    if (Date.now() - lastRefreshRef.current < DEBOUNCE_MS) return;
    inflightRef.current = true;
    const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!endpoint) { inflightRef.current = false; return; }
    try {
      const res = await fetch(`${endpoint}/api/refresh-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, visit_id: visitId }),
      });
      if (res.ok) {
        const data = await res.json();
        onRefresh(data.intro, data.slides);
        lastRefreshRef.current = Date.now();
      }
    } catch {
      // silent failure — images will use existing URLs or show fallback
    } finally {
      inflightRef.current = false;
    }
  }, [slug, visitId, onRefresh]);

  const requestRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return { requestRefresh };
}
