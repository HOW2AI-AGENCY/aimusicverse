import { Suspense, type ReactNode } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * HomeSection — unified wrapper for sections on the home page.
 *
 * Replaces repeated `<motion.section className="mb-3" {...fadeInUp}>` boilerplate
 * across desktop and mobile branches of Index.tsx. Keeps animation, spacing and
 * Suspense fallback consistent and removes duplicate JSX.
 */
interface HomeSectionProps {
  children: ReactNode;
  /** Tailwind margin classes — defaults to mobile mb-3 / desktop xl:mb-0 */
  className?: string;
  /** Optional Suspense fallback. If provided wraps children in <Suspense>. */
  fallback?: ReactNode;
  /** Disable motion (e.g. during loading). */
  animation?: Record<string, unknown>;
  as?: "section" | "div";
  /** Stable identifier used by e2e tests & sticky anchor navigation. */
  sectionId?: string;
}

export const HomeSection = ({
  children,
  className,
  fallback,
  animation,
  as = "section",
  sectionId,
}: HomeSectionProps) => {
  const Tag = as === "div" ? motion.div : motion.section;
  const content = fallback ? <Suspense fallback={fallback}>{children}</Suspense> : children;
  return (
    <Tag
      className={cn(className)}
      data-section-id={sectionId}
      id={sectionId ? `section-${sectionId}` : undefined}
      {...(animation ?? {})}
    >
      {content}
    </Tag>
  );
};
