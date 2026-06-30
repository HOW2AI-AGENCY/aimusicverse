import { cn } from "@/lib/utils";

interface ActiveTabIndicatorProps {
  active: boolean;
  className?: string;
}

export function ActiveTabIndicator({ active, className }: ActiveTabIndicatorProps) {
  return (
    <span
      className={cn(
        "absolute top-1 h-7 w-10 rounded-full bg-primary/12 ring-1 ring-primary/25 transition-all duration-200",
        active ? "opacity-100 scale-100" : "opacity-0 scale-75",
        className,
      )}
      aria-hidden
    />
  );
}
