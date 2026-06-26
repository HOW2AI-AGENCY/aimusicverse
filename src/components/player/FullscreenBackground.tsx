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
            className="absolute inset-0 w-full h-full object-cover blur-3xl"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: [1.1, 1.15, 1.1], opacity: 1 }}
            transition={{
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.5 },
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/20"
                style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
                animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              />
            ))}
          </div>
        </>
      ) : (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-background"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
});
