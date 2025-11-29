import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  children: ReactNode;
  image?: string;
  title?: string;
  subtitle?: string;
  status?: "success" | "warning" | "error" | "info";
  className?: string;
}

export const MessageBubble = ({
  children,
  image,
  title,
  subtitle,
  status,
  className,
}: MessageBubbleProps) => {
  const statusColors = {
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    error: "border-destructive/30 bg-destructive/5",
    info: "border-primary/30 bg-primary/5",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-2xl overflow-hidden",
        status && statusColors[status],
        className
      )}
    >
      {image && (
        <div className="relative w-full aspect-square overflow-hidden">
          <img
            src={image}
            alt={title || "Cover"}
            className="w-full h-full object-cover"
          />
          {status && (
            <div className="absolute top-2 right-2">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md",
                  status === "success" && "bg-green-500/80 text-white",
                  status === "warning" && "bg-yellow-500/80 text-white",
                  status === "error" && "bg-destructive/80 text-white",
                  status === "info" && "bg-primary/80 text-white"
                )}
              >
                {status === "success" && "✓ Готово"}
                {status === "warning" && "⏳ В процессе"}
                {status === "error" && "✗ Ошибка"}
                {status === "info" && "ℹ Инфо"}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        {(title || subtitle) && (
          <div className="mb-3">
            {title && (
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
