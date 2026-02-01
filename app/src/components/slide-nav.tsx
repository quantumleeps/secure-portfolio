"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, LayoutList } from "lucide-react";

interface NavItem {
  label: string;
  section: string;
}

interface SlideNavProps {
  items: NavItem[];
  currentIndex: number;
  totalSlides: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function SlideNav({
  items,
  currentIndex,
  totalSlides,
  onSelect,
  onPrev,
  onNext,
}: SlideNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 select-none items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur-md md:px-4">
      <div className="hidden shrink-0 text-sm font-medium text-muted-foreground md:block md:w-24">
        {items[0]?.label}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:justify-center">
        <LayoutList className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select
          value={String(currentIndex)}
          onValueChange={(v) => onSelect(Number(v))}
        >
          <SelectTrigger className="min-w-0 flex-1 border-border/40 bg-transparent text-sm md:w-[400px] md:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item, i) => (
              <SelectItem key={i} value={String(i)}>
                <span className="truncate">
                  {item.section && (
                    <span className="mr-2 text-xs text-muted-foreground">
                      {item.section}
                    </span>
                  )}
                  {item.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="hidden min-w-[3rem] select-none text-center text-xs text-muted-foreground md:inline">
          {currentIndex + 1} / {totalSlides}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={currentIndex === totalSlides - 1}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
