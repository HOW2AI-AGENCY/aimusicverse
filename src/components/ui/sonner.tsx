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
        // Telegram + device safe areas
        // Different padding based on position
        ...(isMobile
          ? {
              // Bottom positioning for mobile - account for bottom safe area + player
              paddingBottom:
                'max(calc(var(--tg-safe-area-inset-bottom, 0px) + 5rem), calc(env(safe-area-inset-bottom, 0px) + 5rem))',
              paddingLeft:
                'max(calc(var(--tg-content-safe-area-inset-left, 0px) + 0.5rem), calc(env(safe-area-inset-left, 0px) + 0.5rem))',
              paddingRight:
                'max(calc(var(--tg-content-safe-area-inset-right, 0px) + 0.5rem), calc(env(safe-area-inset-right, 0px) + 0.5rem))',
            }
          : {
              // Top positioning for desktop
              paddingTop:
                'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))',
              paddingLeft:
                'max(calc(var(--tg-content-safe-area-inset-left, 0px) + 0.5rem), calc(env(safe-area-inset-left, 0px) + 0.5rem))',
              paddingRight:
                'max(calc(var(--tg-content-safe-area-inset-right, 0px) + 0.5rem), calc(env(safe-area-inset-right, 0px) + 0.5rem))',
            }),
        zIndex: 9999,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:mx-auto group-[.toaster]:w-[calc(100vw-2rem)] group-[.toaster]:max-w-md",
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
