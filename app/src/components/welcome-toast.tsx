"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface WelcomeToastProps {
  confidentiality?: string;
}

export function WelcomeToast({ confidentiality }: WelcomeToastProps) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;

    const timer = setTimeout(() => {
      toast("Welcome", {
        description: confidentiality ? (
          <div className="space-y-2">
            <p>Thanks for visiting — I hope you enjoy my portfolio!</p>
            <p className="font-semibold text-destructive">{confidentiality}</p>
          </div>
        ) : (
          "Thanks for visiting — I hope you enjoy the portfolio."
        ),
        duration: 18000,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [confidentiality]);

  return null;
}
