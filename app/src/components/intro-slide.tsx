import type { Intro } from "@/lib/types";
import { Mail, Phone, MapPin } from "lucide-react";

interface IntroSlideProps {
  intro: Intro;
}

export function IntroSlide({ intro }: IntroSlideProps) {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {intro.name}
        </h1>
        <p className="text-lg text-muted-foreground">{intro.tagline}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {intro.contact.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {intro.contact.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {intro.contact.location}
          </span>
        </div>
      </header>

      <blockquote className="border-l-2 border-primary/50 pl-4 text-lg italic text-muted-foreground">
        {intro.summary}
      </blockquote>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          My Path
        </h2>
        <div className="relative ml-4 border-l border-border/60 pl-6">
          {intro.path.map((p, i) => (
            <div key={i} className="relative mb-6 last:mb-0">
              <div className="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
              <span className="text-sm font-mono font-medium text-primary">
                {p.year}
              </span>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.event}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-base leading-relaxed text-muted-foreground">
          {intro.bio}
        </p>
      </section>
    </div>
  );
}
