import type { Intro, Slide } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, MapPin } from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

interface IntroSlideProps {
  intro: Intro;
  slides?: Slide[];
  onImageError?: () => void;
}

function buildRepoMap(slides: Slide[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const slide of slides) {
    if (slide.repo) {
      const name = slide.repo.split("/").pop();
      if (name) map.set(name, slide.repo);
    }
  }
  return map;
}

function renderNoteWithLinks(
  text: string,
  repoMap: Map<string, string>
): React.ReactNode[] {
  if (repoMap.size === 0) return [text];
  const pattern = new RegExp(
    `(${[...repoMap.keys()].join("|")})`,
    "g"
  );
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const repo = repoMap.get(part);
    if (repo) {
      return (
        <a
          key={i}
          href={`https://${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono underline decoration-dotted underline-offset-2 transition-colors hover:text-primary hover:decoration-solid"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function IntroSlide({ intro, slides, onImageError }: IntroSlideProps) {
  const repoMap = slides ? buildRepoMap(slides) : new Map<string, string>();
  const initials = intro.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-12 xl:max-w-4xl xl:mx-auto">
      <header className="flex flex-row items-start gap-5">
        {intro.avatar && (
          <Avatar className="size-20 shrink-0 ring-2 ring-border shadow-[0_0_15px_rgba(255,255,255,0.25)] sm:size-28">
            <AvatarImage
              src={intro.avatar}
              alt={intro.name}
              onLoadingStatusChange={(status) => {
                if (status === "error") onImageError?.();
              }}
            />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
        )}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {intro.name}
          </h1>
          <p className="text-xl text-muted-foreground">{intro.tagline}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a
              href={`mailto:${intro.contact.email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {intro.contact.email}
            </a>
            <a
              href={`tel:${intro.contact.phone}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5" />
              {intro.contact.phone}
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {intro.contact.location}
            </span>
            <a
              href={`https://${intro.portfolio_note.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              quantumleeps
            </a>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {intro.headline_stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/40 bg-card/50 p-4"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              {stat}
            </p>
          </div>
        ))}
      </section>

      <blockquote className="border-l-2 border-primary/50 pl-4 text-base leading-relaxed text-muted-foreground">
        {intro.positioning}
      </blockquote>

      <div className="animate-shimmer-border rounded-lg border bg-card/50 p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          {intro.portfolio_note.text}
        </p>
        <a
          href={`https://${intro.portfolio_note.repo}/secure-portfolio`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-sm text-primary transition-colors hover:text-primary/80"
        >
          <GitHubIcon className="h-4 w-4" />
          {intro.portfolio_note.repo}/secure-portfolio
        </a>
        <p className="text-xs text-muted-foreground/60">
          {renderNoteWithLinks(intro.portfolio_note.note, repoMap)}
        </p>
      </div>
    </div>
  );
}
