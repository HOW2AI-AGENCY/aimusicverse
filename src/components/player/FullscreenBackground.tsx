import { memo } from "react";
import { getTrackCoverUrl } from "@/lib/imageOptimization";

interface FullscreenBackgroundProps {
  coverUrl: string | null | undefined;
}

export const FullscreenBackground = memo(function FullscreenBackground({ coverUrl }: FullscreenBackgroundProps) {
  const backgroundUrl = coverUrl ? getTrackCoverUrl(coverUrl, "medium") : "";

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {backgroundUrl ? (
        <>
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl saturate-110"
            loading="eager"
            decoding="async"
            fetchPriority="low"
          />
          <div className="absolute inset-0 bg-background/72 backdrop-blur-sm" />
          <div className="absolute inset-0 noise-overlay pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 bg-muted/20 noise-overlay pointer-events-none" />
      )}
    </div>
  );
});
