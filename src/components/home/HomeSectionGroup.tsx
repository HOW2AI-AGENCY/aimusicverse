import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HomeSectionGroup — semantic cluster wrapper for the home page.
 *
 * Groups several `<HomeSection/>` blocks under a shared eyebrow + title,
 * applies a unified vertical rhythm and optional accent action.
 * Use it for *cluster-level* hierarchy (e.g. "Discover", "For you",
 * "Community"). Individual sections retain their own internal headers.
 *
 * Spacing scale (mobile-first):
 *   group↔group  : space-y-10 (40px) — set by parent wrapper
 *   header↔body  : mb-4 (16px)
 *   item↔item    : space-y-4 (16px)
 */
interface HomeSectionGroupProps {
  /** Small uppercase eyebrow above the title (optional). */
  eyebrow?: string;
  /** Cluster title — shown only when provided. */
  title?: string;
  /** Optional right-aligned action link / button. */
  action?: ReactNode;
  /** Tone of the eyebrow — maps to semantic accent token. */
  tone?: "primary" | "muted" | "accent";
  className?: string;
  children: ReactNode;
}

const toneToClass: Record<NonNullable<HomeSectionGroupProps["tone"]>, string> = {
  primary: "text-primary",
  accent: "text-accent",
  muted: "text-muted-foreground",
};

export const HomeSectionGroup = ({
  eyebrow,
  title,
  action,
  tone = "muted",
  className,
  children,
}: HomeSectionGroupProps) => {
  const hasHeader = Boolean(eyebrow || title || action);

  return (
    <section className={cn("w-full", className)} aria-label={title || eyebrow}>
      {hasHeader && (
        <header className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {eyebrow && (
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.2em]",
                  toneToClass[tone],
                )}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
};
