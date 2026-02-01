"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL = 30_000;

export function useHeartbeat(slug: string, visitId: string) {
  const activeRef = useRef(true);

  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
    if (!endpoint) return;

    function sendHeartbeat() {
      if (!activeRef.current) return;
      fetch(`${endpoint}/api/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, visit_id: visitId }),
      }).catch(() => {});
    }

    function handleVisibility() {
      activeRef.current = document.visibilityState === "visible";
    }

    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [slug, visitId]);
}
