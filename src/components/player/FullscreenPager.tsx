/**
 * FullscreenPager — horizontal three-page swiper for the fullscreen player.
 *
 * Pages: Cover ⇄ Lyrics ⇄ Details. Track switching is intentionally NOT bound
 * to horizontal swipe here — that lives in the transport controls and the
 * queue sheet, so users don't accidentally skip songs while exploring lyrics.
 */

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { motion, type PanInfo } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptic";

export type PagerPage = "cover" | "lyrics" | "details";
const ORDER: PagerPage[] = ["cover", "lyrics", "details"];

interface FullscreenPagerProps {
  page: PagerPage;
  onChange: (page: PagerPage) => void;
  cover: ReactNode;
  lyrics: ReactNode;
  details: ReactNode;
}

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 350;

export function FullscreenPager({ page, onChange, cover, lyrics, details }: FullscreenPagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const index = ORDER.indexOf(page);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (next: PagerPage) => {
      if (next === page) return;
      hapticImpact("light");
      onChange(next);
    },
    [page, onChange],
  );

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
        const nextIdx = Math.min(ORDER.length - 1, index + 1);
        goTo(ORDER[nextIdx]);
      } else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
        const prevIdx = Math.max(0, index - 1);
        goTo(ORDER[prevIdx]);
      }
    },
    [goTo, index],
  );

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 overflow-hidden">
      <motion.div
        className="flex h-full"
        style={{ width: width ? width * 3 : "300%" }}
        drag="x"
        dragElastic={0.12}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ x: width ? -index * width : `-${index * 100}%` }}
        transition={{ type: "spring", damping: 32, stiffness: 280 }}
      >
        <div className="h-full shrink-0" style={{ width: width || "33.3333%" }}>
          {cover}
        </div>
        <div className="h-full shrink-0" style={{ width: width || "33.3333%" }}>
          {lyrics}
        </div>
        <div className="h-full shrink-0" style={{ width: width || "33.3333%" }}>
          {details}
        </div>
      </motion.div>

      {/* Page dots */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {ORDER.map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`Перейти к: ${p}`}
            onClick={() => goTo(p)}
            className={cn(
              "pointer-events-auto h-1.5 rounded-full transition-all duration-200",
              p === page ? "w-6 bg-foreground/80" : "w-1.5 bg-foreground/30 hover:bg-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
