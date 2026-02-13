"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
} from "@/components/ui/carousel";

export type Breakpoint = "sm" | "md" | "lg";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("lg");

  React.useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    const updateBreakpoint = () => {
      if (lgQuery.matches) {
        setBreakpoint("lg");
      } else if (mdQuery.matches) {
        setBreakpoint("md");
      } else {
        setBreakpoint("sm");
      }
    };

    updateBreakpoint();

    mdQuery.addEventListener("change", updateBreakpoint);
    lgQuery.addEventListener("change", updateBreakpoint);

    return () => {
      mdQuery.removeEventListener("change", updateBreakpoint);
      lgQuery.removeEventListener("change", updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === "sm";
}

function MobileCarouselNav() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCarousel();

  return (
    <div className="flex justify-end gap-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="rounded-full"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="rounded-full"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface BentoCardProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  /** Grid area name for CSS grid placement */
  area?: string;
}

export function BentoCard({
  title,
  description,
  className,
  children,
  area,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-secondary/50 border border-border p-6 flex flex-col overflow-hidden",
        className,
      )}
      style={area ? { gridArea: area } : undefined}
    >
      <div className="space-y-2 flex-shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex-1 mt-4 min-h-0 overflow-hidden">{children}</div>
      )}
    </div>
  );
}

interface ResponsiveGridConfig {
  /** CSS grid-template-areas string */
  areas?: string;
  /** CSS grid-template-columns */
  cols?: string;
  /** CSS grid-template-rows */
  rows?: string;
}

interface BentoSlideProps {
  children: React.ReactNode;
  className?: string;
  /** CSS grid-template-areas string for custom layouts (lg breakpoint) */
  gridAreas?: string;
  /** CSS grid-template-columns (lg breakpoint) */
  gridCols?: string;
  /** CSS grid-template-rows (lg breakpoint) */
  gridRows?: string;
  /** Grid config for md breakpoint (768px-1023px) */
  md?: ResponsiveGridConfig;
  /** Grid config for lg breakpoint (1024px+), overrides gridAreas/gridCols/gridRows */
  lg?: ResponsiveGridConfig;
}

export function BentoSlide({
  children,
  className,
  gridAreas,
  gridCols = "repeat(3, 1fr)",
  gridRows = "repeat(2, 1fr)",
  md,
  lg,
}: BentoSlideProps) {
  const breakpoint = useBreakpoint();

  // Determine grid config based on current breakpoint
  const getGridConfig = (): ResponsiveGridConfig => {
    if (breakpoint === "md" && md) {
      return {
        areas: md.areas,
        cols: md.cols ?? "repeat(2, 1fr)",
        rows: md.rows ?? "auto",
      };
    }

    // lg breakpoint or fallback
    return {
      areas: lg?.areas ?? gridAreas,
      cols: lg?.cols ?? gridCols,
      rows: lg?.rows ?? gridRows,
    };
  };

  const config = getGridConfig();

  return (
    <div
      className={cn("grid gap-4 h-full", className)}
      style={{
        gridTemplateAreas: config.areas,
        gridTemplateColumns: config.cols,
        gridTemplateRows: config.rows,
      }}
    >
      {children}
    </div>
  );
}

interface BentoCarouselProps {
  children: React.ReactNode;
  className?: string;
  /** How much of the next slide to show (in pixels) */
  peekAmount?: number;
  /** Cards to show in mobile single-file carousel mode */
  mobileCards?: React.ReactNode[];
  /** Side inset for full-bleed mode. When set, carousel extends edge-to-edge with content inset from viewport edges. */
  inset?: string;
}

export function BentoCarousel({
  children,
  className,
  peekAmount = 80,
  mobileCards,
  inset,
}: BentoCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [isDragging, setIsDragging] = React.useState(false);
  const isMobile = useIsMobile();

  // Drag state refs (using refs to avoid re-renders during drag)
  const dragStartX = React.useRef(0);
  const scrollStartX = React.useRef(0);
  const hasDragged = React.useRef(false);

  const childCount = React.Children.count(children);
  const isLastSlide = currentSlide >= childCount - 1;

  const getSlideWidth = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0;
    const firstSlide = container.querySelector("[data-slide]") as HTMLElement;
    return firstSlide ? firstSlide.offsetWidth + 24 : 0; // 24px gap
  }, []);

  const checkScrollability = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const updateCurrentSlide = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const slideWidth = getSlideWidth();
    if (slideWidth === 0) return;

    const newSlide = Math.round(container.scrollLeft / slideWidth);
    setCurrentSlide(Math.max(0, Math.min(newSlide, childCount - 1)));
  }, [childCount, getSlideWidth]);

  React.useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability]);

  // Drag handlers
  const handleDragStart = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    hasDragged.current = false;
    dragStartX.current = clientX;
    scrollStartX.current = container.scrollLeft;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    const deltaX = dragStartX.current - clientX;
    if (Math.abs(deltaX) > 5) {
      hasDragged.current = true;
    }
    container.scrollLeft = scrollStartX.current + deltaX;
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) {
      setIsDragging(false);
      return;
    }

    const slideWidth = getSlideWidth();
    if (slideWidth === 0) {
      setIsDragging(false);
      return;
    }

    // Calculate drag distance and direction
    const dragDistance = container.scrollLeft - scrollStartX.current;
    const dragThreshold = slideWidth * 0.15; // 15% of slide width triggers change

    let targetSlide = currentSlide;

    if (dragDistance > dragThreshold) {
      // Dragged right (next slide)
      targetSlide = Math.min(currentSlide + 1, childCount - 1);
    } else if (dragDistance < -dragThreshold) {
      // Dragged left (previous slide)
      targetSlide = Math.max(currentSlide - 1, 0);
    }

    // Update state immediately for fade effect
    setCurrentSlide(targetSlide);
    setIsDragging(false);

    // Smoothly scroll to the target slide
    const targetScrollLeft = targetSlide * slideWidth;
    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const onMouseUp = () => {
    handleDragEnd();
  };

  const onMouseLeave = () => {
    handleDragEnd();
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    // Update slide index immediately before animation
    setCurrentSlide((prev) => {
      if (direction === "right") {
        return Math.min(prev + 1, childCount - 1);
      } else {
        return Math.max(prev - 1, 0);
      }
    });

    const slideWidth = getSlideWidth();
    if (slideWidth === 0) return;

    const scrollAmount = direction === "left" ? -slideWidth : slideWidth;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Mobile view using shadcn carousel
  if (isMobile && mobileCards) {
    return (
      <Carousel
        className={cn("w-full", className)}
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="-ml-2">
          {mobileCards.map((card, index) => (
            <CarouselItem key={index} className="pl-2 basis-[85%]">
              <div className="h-[320px] [&>*]:h-full">{card}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <MobileCarouselNav />
      </Carousel>
    );
  }

  // Desktop view with custom implementation
  return (
    <div className={cn("relative", className)}>
      {/* Carousel container */}
      <div
        ref={containerRef}
        onScroll={checkScrollability}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          "flex gap-6 overflow-x-auto scrollbar-hide select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          !isDragging && "scroll-smooth",
        )}
        style={{
          scrollSnapType: isDragging ? "none" : "x mandatory",
          WebkitOverflowScrolling: "touch",
          ...(inset && { scrollPaddingLeft: inset }),
        }}
      >
        {inset && (
          <div
            className="flex-shrink-0"
            style={{ width: `calc(${inset} - 24px)` }}
            aria-hidden="true"
          />
        )}
        {React.Children.map(children, (child, index) => {
          const isLast = index === childCount - 1;
          return (
            <div
              key={index}
              data-slide
              className="flex-shrink-0 min-h-[500px] md:min-h-[600px]"
              style={{
                width: inset
                  ? isLast
                    ? `calc(100dvw - 2 * ${inset})`
                    : `calc(100dvw - ${inset} - ${peekAmount + 24}px)`
                  : isLast
                    ? "100%"
                    : `calc(100% - ${peekAmount}px)`,
                scrollSnapAlign: "start",
              }}
            >
              {child}
            </div>
          );
        })}
        {inset && (
          <div
            className="flex-shrink-0"
            style={{ width: `calc(${inset} - 24px)` }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Navigation arrows */}
      <div
        className="flex justify-end gap-2 mt-6"
        style={inset ? { paddingRight: inset } : undefined}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="rounded-full"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="rounded-full"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
