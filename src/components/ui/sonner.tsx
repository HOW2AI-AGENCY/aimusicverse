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
      offset={0}
      style={{
        // Reset all positioning - Sonner sets these internally
        // We override to ensure perfect centering
        left: '50%',
        right: 'auto',
        transform: 'translateX(-50%)',
        width: 'auto',
        maxWidth: 'calc(100vw - 2rem)',
        // Telegram + device safe areas
        ...(isMobile
          ? {
              // Bottom positioning for mobile - account for bottom safe area + player
              bottom: 'max(calc(var(--tg-safe-area-inset-bottom, 0px) + 5rem), calc(env(safe-area-inset-bottom, 0px) + 5rem))',
            }
          : {
              // Top positioning for desktop
              top: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))',
            }),
        zIndex: 9999,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:w-full group-[.toaster]:max-w-md",
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
