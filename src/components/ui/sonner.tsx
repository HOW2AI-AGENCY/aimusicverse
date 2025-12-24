import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors
      offset={0}
      style={{
        // Telegram + device safe areas (avoid native buttons + notches)
        // Increased padding from 12px to 32px for better visibility in Telegram Mini App
        paddingTop:
          'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 32px), calc(env(safe-area-inset-top, 0px) + 32px))',
        paddingLeft:
          'max(var(--tg-content-safe-area-inset-left, 0px), env(safe-area-inset-left, 0px))',
        paddingRight:
          'max(var(--tg-content-safe-area-inset-right, 0px), env(safe-area-inset-right, 0px))',
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
