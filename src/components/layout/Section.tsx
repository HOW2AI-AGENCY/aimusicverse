/**
 * Section — unified building block for home page clusters.
 *
 * One canonical wrapper for Hero / Create / Discover / You blocks. Encodes
 * vertical rhythm, max-width, padding density, optional background tone and
 * a single header (title + subtitle + right slot). Pages compose screens
 * from <Section/> instances instead of bespoke wrappers.
 *
 * Design tokens used (single source of truth):
 *   spacing.block   = space between sections (mobile 40px / desktop 56px)
 *   spacing.section = space inside section between header and body (16-24px)
 *   spacing.item    = space between items inside body (8-16px)
 *   maxWidth        = 'content' (1120px) | 'wide' (1280px) | 'full'
 *
 * Do not introduce additional spacing scales in home/* — extend this file.
 */

import { forwardRef, type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

export type SectionDensity = "compact" | "comfortable" | "spacious" | "auto";
export type SectionTone =
  | "plain"
  | "subtle"
  | "accent"
  | "muted"
  | "light"
  | "dark"
  | "blur"
  | "gradient";
export type SectionMaxWidth = "content" | "wide" | "full";

export interface SectionProps {
  /** Visible title (renders <h2>). Omit for headerless sections. */
  title?: string;
  /** Optional subtitle under the title. */
  subtitle?: string;
  /** Optional eyebrow above the title (uppercased, small). */
  eyebrow?: string;
  /** Right-side header slot (links, tabs, actions). */
  headerRight?: ReactNode;
  /** Stable id used for anchor / e2e selectors. */
  sectionId?: string;
  /** aria-label override (defaults to title). */
  ariaLabel?: string;
  /**
   * Vertical density.
   * `auto` = compact on mobile, comfortable on `sm+`, spacious on `lg+`.
   */
  density?: SectionDensity;
  /** Background tone — `plain` paints nothing, others paint a surface. */
  tone?: SectionTone;
  /** Max content width. */
  maxWidth?: SectionMaxWidth;
  /** Render as a different element (default <section>). */
  as?: ElementType;
  /** Append classes to the outer wrapper. */
  className?: string;
  /** Append classes to the body wrapper. */
  bodyClassName?: string;
  children: ReactNode;
}

const densityToBodyGap: Record<SectionDensity, string> = {
  compact: "space-y-3",
  comfortable: "space-y-4 sm:space-y-5",
  spacious: "space-y-6 sm:space-y-8",
  auto: "space-y-3 sm:space-y-5 lg:space-y-7",
};

const densityToHeaderGap: Record<SectionDensity, string> = {
  compact: "mb-3",
  comfortable: "mb-4",
  spacious: "mb-5 sm:mb-6",
  auto: "mb-3 sm:mb-4 lg:mb-6",
};

const densityToInnerPad: Record<SectionDensity, string> = {
  compact: "p-3 sm:p-4",
  comfortable: "p-4 sm:p-5",
  spacious: "p-5 sm:p-7",
  auto: "p-3 sm:p-5 lg:p-6",
};

const toneToSurface: Record<SectionTone, string> = {
  plain: "",
  subtle: "rounded-2xl bg-card/40 border border-border/40",
  accent: "rounded-2xl bg-primary/[0.06] border border-primary/15",
  muted: "rounded-2xl bg-muted/30",
  light: "rounded-2xl bg-background/80 border border-border/30",
  dark: "rounded-2xl bg-foreground/[0.04] border border-foreground/10 dark:bg-black/30 dark:border-white/5",
  blur: "rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 supports-[backdrop-filter]:bg-card/30",
  gradient:
    "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10",
};

const maxWidthToClass: Record<SectionMaxWidth, string> = {
  content: "max-w-[1120px]",
  wide: "max-w-screen-xl",
  full: "max-w-none",
};

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  {
    title,
    subtitle,
    eyebrow,
    headerRight,
    sectionId,
    ariaLabel,
    density = "comfortable",
    tone = "plain",
    maxWidth = "content",
    as,
    className,
    bodyClassName,
    children,
  },
  ref,
) {
  const Tag = (as ?? "section") as ElementType;
  const hasHeader = Boolean(title || eyebrow || headerRight);
  const hasSurface = tone !== "plain";

  return (
    <Tag
      ref={ref as never}
      id={sectionId ? `section-${sectionId}` : undefined}
      data-section-id={sectionId}
      data-density={density}
      data-tone={tone}
      aria-label={ariaLabel ?? title ?? eyebrow}
      className={cn(
        "w-full mx-auto",
        maxWidthToClass[maxWidth],
        toneToSurface[tone],
        hasSurface && densityToInnerPad[density],
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            "flex items-end justify-between gap-3",
            densityToHeaderGap[density],
          )}
        >
          <div className="min-w-0 space-y-1">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </header>
      )}
      <div className={cn(densityToBodyGap[density], bodyClassName)}>{children}</div>
    </Tag>
  );
});

/**
 * Spacing tokens — re-export so consumers never hardcode values.
 * mobile-first, multiples of 8px.
 */
export const sectionTokens = {
  /** Gap between top-level Section blocks on a page. */
  blockGap: "space-y-10 xl:space-y-14",
  /** Inner container horizontal padding. */
  containerPadding: "px-4 sm:px-6 lg:px-8",
  /** Max width for the page shell. */
  shellMaxWidth: "max-w-screen-xl",
} as const;
