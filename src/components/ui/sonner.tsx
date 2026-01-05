import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getToastStyles, TOAST_Z_INDEX } from "@/lib/toast-position";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Get additional offset for Telegram Mini App
 * Accounts for dynamic viewport changes
 */
const getTelegramOffset = (): number => {
  if (typeof window === 'undefined') return 0;
  
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
        zIndex: TOAST_Z_INDEX.system,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:min-w-[200px] group-[.toaster]:p-3 sm:group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:px-3 group-[.toast]:py-2",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:px-3 group-[.toast]:py-2",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
