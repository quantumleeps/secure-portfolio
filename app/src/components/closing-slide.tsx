import type { Closing } from "@/lib/types";
import { Mail, Phone, MapPin } from "lucide-react";

interface ClosingSlideProps {
  closing: Closing;
}

function renderMarkdownBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function ClosingSlide({ closing }: ClosingSlideProps) {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {closing.headline}
        </h1>
      </header>

      <ul className="space-y-4">
        {closing.bullets.map((bullet, i) => (
          <li
            key={i}
            className="flex gap-3 text-base leading-relaxed text-muted-foreground"
          >
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
            <span>{renderMarkdownBold(bullet)}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-border/40 bg-card/50 p-8">
        <p className="mb-4 text-lg font-semibold text-foreground">
          {closing.contact.name}
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <a
            href={`mailto:${closing.contact.email}`}
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            {closing.contact.email}
          </a>
          <a
            href={`tel:${closing.contact.phone}`}
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Phone className="h-4 w-4" />
            {closing.contact.phone}
          </a>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {closing.contact.location}
          </span>
        </div>
      </div>
    </div>
  );
}
