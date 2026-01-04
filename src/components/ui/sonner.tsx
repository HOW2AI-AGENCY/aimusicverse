import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      expand={false}
      richColors
      offset={isMobile ? 16 : 8}
      // Limit visible toasts on mobile to prevent clutter
      visibleToasts={isMobile ? 2 : 3}
      // Gap between stacked toasts
      gap={8}
      style={{
        // Use left-0 right-0 for reliable centering on mobile
        // Avoid translateX(-50%) with calc widths - causes alignment issues
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'calc(100% - 2rem)',
        maxWidth: '24rem', // max-w-sm
        minWidth: '200px', // Prevent vertical text on narrow screens
        // Telegram + device safe areas  
        ...(isMobile
          ? {
              // Bottom positioning for mobile - account for bottom safe area + island nav (5rem) + telegram offset
              bottom: `max(calc(var(--tg-safe-area-inset-bottom, 0px) + 5.5rem + ${telegramOffset}px), calc(env(safe-area-inset-bottom, 0px) + 5.5rem))`,
            }
          : {
              // Top positioning for desktop
              top: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))',
            }),
        zIndex: 100, // z-[100] per Z_INDEX_HIERARCHY.md for system notifications
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:min-w-[200px]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
