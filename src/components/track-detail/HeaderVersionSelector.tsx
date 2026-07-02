/**
 * Compact version selector for TrackDetailSheet header
 * Allows switching between track versions with immediate UI update
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useVersionSwitcher } from "@/hooks/useVersionSwitcher";
import { useHeaderVersionSelector, type TrackVersionDetail } from "@/hooks/track-detail/useHeaderVersionSelector";
import { Loader2, GitBranch } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { logger } from "@/lib/logger";

interface HeaderVersionSelectorProps {
  trackId: string;
  activeVersionId?: string | null;
  onVersionChange?: (versionId: string) => void;
  className?: string;
}

export function HeaderVersionSelector({
  trackId,
  activeVersionId,
  onVersionChange,
  className,
}: HeaderVersionSelectorProps) {
  const { data: versions = [], isLoading: isLoadingQuery } = useHeaderVersionSelector(trackId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(activeVersionId || null);
  const { setPrimaryVersionAsync, isSettingPrimary } = useVersionSwitcher();

  useEffect(() => {
    if (isLoadingQuery) return;
    if (activeVersionId) {
      setActiveId(activeVersionId);
      return;
    }
    const primary = versions.find((v) => v.is_primary);
    setActiveId(primary?.id || versions[0]?.id || null);
  }, [versions, activeVersionId, isLoadingQuery]);

  const handleVersionSelect = async (version: TrackVersionDetail) => {
    if (version.id === activeId || isUpdating) return;

    triggerHapticFeedback("light");
    setIsUpdating(true);

    try {
      await setPrimaryVersionAsync({ trackId, versionId: version.id });

      setActiveId(version.id);
      onVersionChange?.(version.id);
    } catch (error) {
      logger.error("Error switching version", { error });
      toast.error("Ошибка переключения версии");
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't render if single version or less
  if (isLoadingQuery) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length <= 1) {
    return null;
  }

  const activeVersion = versions.find((v) => v.id === activeId);
  const activeLabel = activeVersion?.version_label || "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1.5 text-xs font-medium", isUpdating && "opacity-50", className)}
          disabled={isUpdating}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Версия {activeLabel}</span>
          {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {versions.map((version) => {
          const isActive = version.id === activeId;
          const label = version.version_label || "A";

          return (
            <DropdownMenuItem
              key={version.id}
              onClick={() => handleVersionSelect(version)}
              className={cn("flex items-center justify-between gap-2", isActive && "bg-primary/10 font-medium")}
            >
              <span>Версия {label}</span>
              {isActive && <span className="text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
