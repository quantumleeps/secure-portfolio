"use client";

import { useCallback, useState } from "react";
import { ClipboardCheck, Mail, Phone } from "lucide-react";

interface ContactSectionProps {
  email?: string;
  phone?: string;
}

export function ContactSection({ email, phone }: ContactSectionProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleReachOutClick = useCallback(async () => {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  }, [email]);

  return (
    <div className="contact-group space-y-3">
      {(email || phone) && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {email && (
            <div className="relative">
              <button
                onClick={handleReachOutClick}
                className="contact-glow contact-glow-email flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                {email}
              </button>
              {showCopied && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none">
                  <span className="animate-copy-rise flex items-center gap-1 text-xs text-foreground whitespace-nowrap">
                    <ClipboardCheck className="h-3 w-3" />
                    copied
                  </span>
                </div>
              )}
            </div>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="contact-glow flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5" />
              {phone}
            </a>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground/60 pl-4">
        Looking for something
        specific? Feel free to{" "}
        {email ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleReachOutClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleReachOutClick();
            }}
            className="contact-nudge text-muted-foreground"
          >
            reach out
          </span>
        ) : (
          <span className="contact-nudge text-muted-foreground">
            reach out
          </span>
        )}
        .
      </p>
    </div>
  );
}
