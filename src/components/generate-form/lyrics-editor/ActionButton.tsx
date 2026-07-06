import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  destructive?: boolean;
}

export function ActionButton({ label, onClick, disabled, icon, destructive }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "h-9 w-9 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg",
        "transition-colors touch-manipulation",
        "disabled:opacity-30 disabled:pointer-events-none",
        destructive
          ? "text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      {icon}
    </button>
  );
}
