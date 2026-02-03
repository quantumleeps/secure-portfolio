"use client";

import { useState, useCallback, useEffect } from "react";
import type { PortfolioData } from "@/lib/types";
import { SlideNav } from "./slide-nav";
import { IntroSlide } from "./intro-slide";
import { ProjectSlide } from "./project-slide";
import { ClosingSlide } from "./closing-slide";
import { WelcomeToast } from "./welcome-toast";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { usePrefetchImages } from "@/hooks/use-prefetch-images";

interface PortfolioViewerProps {
  data: PortfolioData;
}

export function PortfolioViewer({ data }: PortfolioViewerProps) {
  const { intro, slides, closing, slug, visit_id } = data;
  const totalSlides = slides.length + 2; // intro + projects + closing
  const [currentIndex, setCurrentIndex] = useState(0);

  useHeartbeat(slug, visit_id);
  usePrefetchImages(slides);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentIndex(index);
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    },
    [totalSlides]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  const navItems = [
    { label: intro.name, section: "" },
    ...slides.map((s) => ({ label: s.title, section: s.section })),
    { label: closing.headline, section: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <WelcomeToast />
      <SlideNav
        items={navItems}
        currentIndex={currentIndex}
        totalSlides={totalSlides}
        onSelect={goTo}
        onPrev={goPrev}
        onNext={goNext}
      />
      <main className="pt-16">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {currentIndex === 0 && <IntroSlide intro={intro} />}
          {currentIndex > 0 && currentIndex < totalSlides - 1 && (
            <ProjectSlide slide={slides[currentIndex - 1]} />
          )}
          {currentIndex === totalSlides - 1 && <ClosingSlide closing={closing} />}
        </div>
      </main>
    </div>
  );
}
