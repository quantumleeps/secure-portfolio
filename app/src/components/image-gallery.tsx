"use client";

import { useState, useEffect } from "react";
import type { SlideImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageGalleryProps {
  images: SlideImage[];
  slideId: string;
  onImageError?: () => void;
}

function ImageLightbox({ image, onImageError }: { image: SlideImage; onImageError?: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    setImgLoaded(false);
  }, [image.src]);

  return (
    <Dialog>
      <figure className="space-y-2">
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted/60 dark:bg-muted/40"
          >
            {image.src && !imgFailed ? (
              <div className="relative aspect-video w-full">
                {!imgLoaded && (
                  <Skeleton className="absolute inset-0 rounded-lg" />
                )}
                <img
                  src={image.src}
                  alt={image.title}
                  className={cn(
                    "aspect-video w-full select-none object-cover transition-opacity duration-500",
                    imgLoaded ? "opacity-100" : "opacity-0"
                  )}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgFailed(true); onImageError?.(); }}
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center p-8 text-sm text-muted-foreground">
                {image.title}
              </div>
            )}
          </button>
        </DialogTrigger>
        {image.caption && (
          <figcaption className="text-center text-xs text-muted-foreground">
            {image.caption}
          </figcaption>
        )}
      </figure>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)] border border-border bg-background p-2 md:p-4 [&>button]:text-foreground">
        <DialogTitle className="sr-only">{image.title}</DialogTitle>
        <img
          src={image.src}
          alt={image.title}
          className="max-h-[calc(100vh-10rem)] w-full select-none rounded-md object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </DialogContent>
    </Dialog>
  );
}

function ImageCarousel({ images, slideId, onImageError }: ImageGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={`${slideId}-${i}`}>
              <ImageLightbox image={img} onImageError={onImageError} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-background/80 backdrop-blur-sm" />
        <CarouselNext className="right-2 bg-background/80 backdrop-blur-sm" />
      </Carousel>

      <div className="flex items-center justify-center gap-3">
        <span className="text-xs tabular-nums text-muted-foreground">
          {current + 1} / {count}
        </span>
        <div
          className="flex gap-1.5"
          role="tablist"
          aria-label="Image navigation"
        >
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ImageGallery({ images, slideId, onImageError }: ImageGalleryProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return <ImageLightbox image={images[0]} onImageError={onImageError} />;
  }

  return <ImageCarousel images={images} slideId={slideId} onImageError={onImageError} />;
}
