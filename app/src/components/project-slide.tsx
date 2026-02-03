import type { Slide } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ProjectSlideProps {
  slide: Slide;
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

export function ProjectSlide({ slide }: ProjectSlideProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-3 xl:max-w-4xl">
        {slide.section && (
          <Badge
            variant="secondary"
            className="text-xs font-semibold uppercase tracking-widest"
          >
            {slide.section}
          </Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {slide.title}
        </h1>
        <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
      </header>

      <div className="xl:grid xl:grid-cols-[1fr_20rem] xl:gap-x-10">
        <div className="space-y-10">
          {slide.challenge && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                The Challenge
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {slide.challenge}
              </p>
            </section>
          )}

          {slide.images.length > 0 && (
            <div className="space-y-4">
              {slide.images.map((img, i) => (
                <figure key={`${slide.slide_id}-${i}`} className="space-y-2">
                  <div className="overflow-hidden rounded-lg bg-muted/30">
                    {img.src ? (
                      <>
                        <img
                          src={img.src}
                          alt={img.title}
                          className="pointer-events-none select-none aspect-video w-full object-cover"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                          }}
                        />
                        <div className="hidden aspect-video items-center justify-center p-8 text-sm text-muted-foreground">
                          {img.title}
                        </div>
                      </>
                    ) : (
                      <div className="flex aspect-video items-center justify-center p-8 text-sm text-muted-foreground">
                        {img.title}
                      </div>
                    )}
                  </div>
                  {img.caption && (
                    <figcaption className="text-center text-xs text-muted-foreground">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {(slide.built || (slide.built_items && slide.built_items.length > 0)) && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                What Was Built
              </h2>
              {slide.built ? (
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {slide.built}
                </p>
              ) : (
                <ul className="space-y-3">
                  {slide.built_items!.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>{renderMarkdownBold(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="mt-10 space-y-10 xl:mt-0">
          {slide.impact.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Impact
              </h2>
              <ul className="space-y-2">
                {slide.impact.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span>{renderMarkdownBold(item)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {slide.tech_stack.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {slide.tech_stack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
