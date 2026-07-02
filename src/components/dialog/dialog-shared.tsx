import React from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DIALOG_CONFIG } from "./unified-dialog.config";

export function DialogBackdrop({
  visible,
  onClick,
  blur = DIALOG_CONFIG.backdrop.blur,
  opacity = DIALOG_CONFIG.backdrop.opacity,
}: {
  visible: boolean;
  onClick?: () => void;
  blur?: string;
  opacity?: number;
}) {
  return (
    <motion.div
      className={cn("fixed inset-0 z-40 bg-black", visible && "pointer-events-auto")}
      style={{
        backdropFilter: blur ? `blur(${blur})` : undefined,
        opacity: visible ? opacity : 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? opacity : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DIALOG_CONFIG.animations.close.duration / 1000 }}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

export function DialogContainer({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[size];

  return (
    <motion.div
      className={cn(
        "relative z-50 bg-background rounded-lg shadow-lg",
        "max-h-[90vh] overflow-auto",
        sizeClass,
        className,
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        duration: DIALOG_CONFIG.animations.open.duration / 1000,
        ease: DIALOG_CONFIG.animations.open.easing as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}
