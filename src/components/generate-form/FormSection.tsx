/**
 * FormSection - Visual container for form sections
 * Provides consistent spacing, background, and grouping
 * Uses design system tokens (Spec 032)
 *
 * Optional `step`/`title`/`icon` props render a numbered group header and
 * promote the section to a distinct card (border + soft surface + left accent),
 * so multi-group forms (e.g. the advanced/custom generation form) read as a
 * sequence of clearly separated steps instead of one continuous scroll.
 */

import { memo, ReactNode } from "react";
import { motion } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";

export type FormSectionTone = "default" | "style" | "lyrics" | "voice" | "settings";

const TONE_ACCENT: Record<FormSectionTone, string> = {
  default: "bg-muted/60 text-foreground/80 border-border/50",
  style: "bg-primary/10 text-primary border-primary/20",
  lyrics: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  voice: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  settings: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const TONE_BAR: Record<FormSectionTone, string> = {
  default: "before:bg-border/60",
  style: "before:bg-primary/40",
  lyrics: "before:bg-violet-500/40",
  voice: "before:bg-pink-500/40",
  settings: "before:bg-slate-500/40",
};

interface FormSectionProps {
  children: ReactNode;
  className?: string;
  /** Add subtle background to distinguish section */
  elevated?: boolean;
  /** Step number shown in a small badge next to the title (1-indexed) */
  step?: number;
  /** Group title — rendering it promotes the section to a bordered, numbered card */
  title?: string;
  /** Optional one-line description under the title */
  description?: string;
  /** Optional icon rendered inside the step badge (replaces the number) */
  icon?: ReactNode;
  /** Muted accent used for the step badge + left edge bar */
  tone?: FormSectionTone;
}

export const FormSection = memo(function FormSection({
  children,
  className,
  elevated = false,
  step,
  title,
  description,
  icon,
  tone = "default",
}: FormSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const isGroup = Boolean(title);

  return (
    <motion.div
      className={cn(
        "space-y-2.5",
        (elevated || isGroup) && cn("p-3.5 rounded-2xl", glass.subtle),
        isGroup &&
          cn(
            "relative pl-4 before:absolute before:left-2 before:top-3.5 before:bottom-3.5",
            "before:w-[3px] before:rounded-full",
            TONE_BAR[tone],
          ),
        className,
      )}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {isGroup && (
        <div className="flex items-start gap-2.5 mb-1">
          <span
            className={cn(
              "shrink-0 flex items-center justify-center w-6 h-6 rounded-lg border text-[11px] font-bold",
              TONE_ACCENT[tone],
            )}
            aria-hidden
          >
            {icon ?? step}
          </span>
          <div className="min-w-0 flex-1 pt-px">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
            {description && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
});

/**
 * FormDivider - Visual separator between form sections
 */
export const FormDivider = memo(function FormDivider({ className }: { className?: string }) {
  // Invisible spacer — symmetric vertical rhythm without harsh hairlines.
  return <div className={cn("h-3", className)} aria-hidden />;
});
