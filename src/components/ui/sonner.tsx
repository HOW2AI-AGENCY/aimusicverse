import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getToastStyles, Z_INDEX } from "@/lib/toast-position";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Get additional offset for Telegram Mini App
 * Accounts for dynamic viewport changes
 */
const getTelegramOffset = (): number => {
  if (typeof window === "undefined") return 0;

  const tgApp = window.Telegram?.WebApp;
  if (!tgApp) return 0;

  // Account for keyboard or viewport changes in Telegram
  const isExpanded = tgApp.isExpanded;
  return isExpanded ? 0 : 20;
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  // On mobile, use bottom-center to avoid Telegram header buttons
  const position = isMobile ? "bottom-center" : "top-center";

  // Calculate dynamic offset for Telegram
  const telegramOffset = getTelegramOffset();

  // Get unified positioning styles
  const positionStyles = getToastStyles(isMobile, telegramOffset);

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      expand={false}
      richColors
      // No offset - controlled via positionStyles for symmetry
      offset={0}
      // Limit visible toasts on mobile to prevent clutter
      visibleToasts={isMobile ? 2 : 3}
      // Gap between stacked toasts
      gap={8}
      style={{
        // Use unified positioning from toast-position utility
        ...positionStyles,
        zIndex: Z_INDEX.system, // 300 - above sheets/dialogs but below context menus
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: cn(
            "group toast",
            "group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border/60",
            "group-[.toaster]:bg-popover/95 group-[.toaster]:text-popover-foreground",
            "group-[.toaster]:backdrop-blur-xl group-[.toaster]:backdrop-saturate-150",
            "group-[.toaster]:shadow-[0_10px_30px_-12px_hsl(240_60%_2%/0.55),0_0_0_1px_hsl(var(--primary)/0.08)_inset]",
            "group-[.toaster]:min-h-[52px] group-[.toaster]:w-full group-[.toaster]:max-w-full",
            "group-[.toaster]:px-3.5 group-[.toaster]:py-3 sm:group-[.toaster]:px-4",
            "group-[.toaster]:gap-2.5",
            "group-[.toaster]:text-[13.5px] group-[.toaster]:font-medium group-[.toaster]:leading-tight",
          ),
          title: "group-[.toast]:font-semibold group-[.toast]:tracking-tight",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-[12.5px] group-[.toast]:leading-snug group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:h-8 group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted/60 group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:h-8 group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-medium",
          closeButton:
            "group-[.toast]:bg-background/80 group-[.toast]:border group-[.toast]:border-border/60 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
          icon: "group-[.toast]:shrink-0",
          success: "group-[.toaster]:!border-emerald-500/30",
          error: "group-[.toaster]:!border-destructive/40",
          warning: "group-[.toaster]:!border-amber-500/30",
          info: "group-[.toaster]:!border-primary/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
