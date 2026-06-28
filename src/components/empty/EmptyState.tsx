import { memo } from "react";
import { motion } from "@/lib/motion";
import { Music, Search, ListMusic, HelpCircle } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: "music" | "search" | "playlist" | "help";
  title: string;
  message: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  helpLink?: string;
  className?: string;
}

const icons = {
  music: Music,
  search: Search,
  playlist: ListMusic,
  help: HelpCircle,
};

export const EmptyState = memo(function EmptyState({
  icon = "music",
  title,
  message,
  primaryAction,
  secondaryAction,
  helpLink,
  className,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center min-h-[300px] px-6 py-12 text-center", className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="sm">
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="outline" size="sm">
            {secondaryAction.label}
          </Button>
        )}
      </div>
      {helpLink && (
        <a
          href={helpLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-3 h-3 inline mr-1" />
          Справка
        </a>
      )}
    </motion.div>
  );
});
