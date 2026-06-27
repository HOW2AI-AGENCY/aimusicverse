import { memo } from "react";
import { motion } from "@/lib/motion";

interface FullscreenBackgroundProps {
  coverUrl: string | null | undefined;
}

export const FullscreenBackground = memo(function FullscreenBackground({ coverUrl }: FullscreenBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {coverUrl ? (
        <>
          <motion.img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-3xl saturate-[1.2]"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: [1.1, 1.15, 1.1], opacity: 1 }}
            transition={{
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.5 },
            }}
          />
          {/* Aurora gradient overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 30% 20%, hsl(152 42% 56% / 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(262 55% 70% / 0.1) 0%, transparent 50%)",
            }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-background/65 backdrop-blur-sm" />
          {/* Noise grain */}
          <div className="absolute inset-0 noise-overlay pointer-events-none" />
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${10 + i * 11}%`,
                  top: `${15 + (i % 4) * 20}%`,
                  width: i % 2 === 0 ? 3 : 2,
                  height: i % 2 === 0 ? 3 : 2,
                  background: i % 3 === 0
                    ? "hsl(152 42% 56% / 0.4)"
                    : i % 3 === 1
                      ? "hsl(199 70% 62% / 0.3)"
                      : "hsl(262 55% 70% / 0.3)",
                }}
                animate={{ y: [0, -40, 0], opacity: [0.15, 0.5, 0.15], scale: [1, 1.8, 1] }}
                transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 25% 20%, hsl(152 42% 56% / 0.2) 0%, transparent 50%), radial-gradient(ellipse at 75% 80%, hsl(262 55% 70% / 0.15) 0%, transparent 50%), hsl(240 46% 5%)",
            }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 noise-overlay pointer-events-none" />
        </>
      )}
    </div>
  );
});
