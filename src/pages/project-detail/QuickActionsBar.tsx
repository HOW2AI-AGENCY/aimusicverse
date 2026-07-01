/**
 * QuickActionsBar — мобильная (2x2 grid) и десктопная (горизонтальная полоса) версии.
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 */

import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "@/lib/icons";
import { MobileQuickActionsGrid } from "@/components/project/detail/MobileQuickActionsGrid";
import { ShareProjectCard } from "@/components/project/ShareProjectCard";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";

interface QuickActionsBarProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>["project"]>;
  isMobile: boolean;
  isGenerating: boolean;
  totalTracks: number;
  tracksWithMaster: number;
  onAddTrack: () => void;
  onGenerateTracklist: () => void;
  onOpenAI: () => void;
  onShare: () => void;
}

export function QuickActionsBar({
  project,
  isMobile,
  isGenerating,
  totalTracks,
  tracksWithMaster,
  onAddTrack,
  onGenerateTracklist,
  onOpenAI,
  onShare,
}: QuickActionsBarProps) {
  // Mobile: 2x2 icon grid
  if (isMobile) {
    return (
      <MobileQuickActionsGrid
        isGenerating={isGenerating}
        onAddTrack={onAddTrack}
        onGenerateTracklist={onGenerateTracklist}
        onOpenAI={onOpenAI}
        onShare={onShare}
        className="sticky top-0 z-30"
      />
    );
  }

  // Desktop: horizontal button row
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Button size="sm" onClick={onAddTrack} className="gap-1.5 shrink-0 bg-primary h-7 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" />
          Трек
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateTracklist}
          disabled={isGenerating}
          className="gap-1.5 shrink-0 h-7 px-3 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI треклист
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenAI} className="gap-1.5 shrink-0 h-7 px-3 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </Button>
        <ShareProjectCard
          project={{
            id: project.id,
            title: project.title,
            cover_url: project.cover_url,
            genre: project.genre,
            total_tracks_count: totalTracks,
            approved_tracks_count: tracksWithMaster,
          }}
          variant="button"
          className="gap-1.5 shrink-0 h-7 px-3 text-xs"
        />
      </div>
    </div>
  );
}
