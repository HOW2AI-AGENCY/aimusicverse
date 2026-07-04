import { memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";

interface VisualizerData {
  frequencies: number[];
  average: number;
  isFallback: boolean;
}

interface FullscreenVisualizerProps {
  show: boolean;
  isPlaying: boolean;
  visualizerData: VisualizerData;
}

export const FullscreenVisualizer = memo(function FullscreenVisualizer({
  show,
  isPlaying,
  visualizerData,
}: FullscreenVisualizerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden"
        >
          <div className="px-4 py-3 bg-gradient-to-t from-background/80 to-transparent">
            {visualizerData.isFallback && (
              <div className="text-[10px] text-muted-foreground/50 text-center mb-1">Визуализация недоступна</div>
            )}
            <div className="flex items-end justify-center gap-[2px] h-16">
              {visualizerData.frequencies.map((freq, index) => {
                const isCenter = Math.abs(index - visualizerData.frequencies.length / 2) < 8;
                const heightPercent = Math.max(8, freq * 100);
                const baseOpacity = visualizerData.isFallback ? 0.4 : 0.6;

                return (
                  <motion.div
                    key={index}
                    className="rounded-full"
                    style={{
                      width: isCenter ? "3px" : "2px",
                      backgroundColor: `hsl(var(--primary) / ${0.3 + freq * 0.7})`,
                      boxShadow:
                        !visualizerData.isFallback && freq > 0.6 ? `0 0 8px hsl(var(--primary) / 0.5)` : "none",
                    }}
                    animate={{
                      height: `${heightPercent}%`,
                      opacity: isPlaying ? baseOpacity + freq * 0.4 : 0.3,
                    }}
                    transition={{ duration: 0.05 }}
                  />
                );
              })}
            </div>
            <motion.div
              className="mt-2 mx-auto h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{
                width: `${30 + visualizerData.average * 70}%`,
                opacity: isPlaying ? (visualizerData.isFallback ? 0.3 : 0.4) + visualizerData.average * 0.6 : 0.2,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
