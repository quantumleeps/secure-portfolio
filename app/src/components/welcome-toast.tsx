"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

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
            <div className="border-t border-border pt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="size-3.5 shrink-0 mt-0.5" />
              <span>{confidentiality}</span>
            </div>
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
