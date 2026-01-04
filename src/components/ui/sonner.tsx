import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  // On mobile, use bottom-center to avoid Telegram header buttons
  const position = isMobile ? "bottom-center" : "top-center";

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      expand={false}
      richColors
      offset={isMobile ? 16 : 8}
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
              // Bottom positioning for mobile - account for bottom safe area + island nav (4rem)
              bottom: 'max(calc(var(--tg-safe-area-inset-bottom, 0px) + 5.5rem), calc(env(safe-area-inset-bottom, 0px) + 5.5rem))',
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
