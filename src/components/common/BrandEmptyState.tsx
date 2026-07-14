/**
 * BrandEmptyState — onboarding-quality empty state with a brand anchor.
 * Uses the locked Neon Studio palette (violet #7C5CFF + mint #22E4A7)
 * and Bricolage Grotesque headings to stay consistent with the redesign.
 */
import { memo } from "react";
import { motion } from "@/lib/motion";
import type { LucideIcon } from "@/lib/icons";
import { Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface BrandEmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "ghost";
}

interface BrandEmptyStateProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: BrandEmptyStateAction;
  secondaryAction?: BrandEmptyStateAction;
  hints?: string[];
  className?: string;
}

const BRICOLAGE = '"Bricolage Grotesque", "Inter", ui-sans-serif, system-ui, sans-serif';

function BrandEmptyStateImpl({
  icon: Icon = Sparkles,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  hints,
  className,
}: BrandEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 text-center",
        className,
      )}
      role="region"
      aria-label={title}
    >
      {/* mint glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
        style={{ background: "#22E4A7", filter: "blur(70px)", opacity: 0.18 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full"
        style={{ background: "#7C5CFF", filter: "blur(70px)", opacity: 0.22 }}
      />

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
        {/* Brand anchor */}
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_10px_40px_rgba(124,92,255,0.35)]"
          style={{
            background: "linear-gradient(135deg, #7C5CFF 0%, #22E4A7 100%)",
          }}
          aria-hidden
        >
          <Icon className="h-8 w-8 text-[#0A0B14]" />
        </div>

        {eyebrow && (
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary"
            style={{ fontFamily: BRICOLAGE }}
          >
            {eyebrow}
          </p>
        )}

        <h3
          className="text-xl sm:text-2xl font-bold text-foreground"
          style={{ fontFamily: BRICOLAGE, letterSpacing: "-0.01em" }}
        >
          {title}
        </h3>

        {description && (
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}

        {hints && hints.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Идеи для старта">
            {hints.map((hint) => (
              <li
                key={hint}
                className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
              >
                {hint}
              </li>
            ))}
          </ul>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2 w-full sm:w-auto">
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" aria-hidden />}
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-[#0A0B14] shadow-[0_6px_20px_rgba(34,228,167,0.35)] transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22E4A7]/60"
                style={{ background: "#22E4A7" }}
              >
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4" aria-hidden />}
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const BrandEmptyState = memo(BrandEmptyStateImpl);
