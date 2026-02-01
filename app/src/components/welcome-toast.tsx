"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    const timer = setTimeout(() => {
      toast("Thanks for visiting", {
        description:
          "I hope you enjoy the portfolio. Looking forward to connecting soon.",
        duration: 25000,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
