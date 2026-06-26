import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Download,
  Undo2,
  Redo2,
  Rows3,
  Sliders,
  Loader2,
  Upload,
  Plus,
  Cloud,
  CloudOff,
  Sparkles,
} from "@/lib/icons";
import type { ViewMode } from "@/stores/useUnifiedStudioStore";
import type { AutoSaveStatus } from "@/hooks/studio/useAutoSave";

interface StudioShellHeaderProps {
  projectName: string;
  trackCount: number;
  isMobile: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isOfflineCapable: boolean;
  isOnline: boolean;
  autoSaveStatus: AutoSaveStatus;
  autoSaveLastSavedAt: string | null;
  autoSaveTimeSinceLastSave: number | null;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  onGenerate: () => void;
  onMixerOpen: () => void;
}

export const StudioShellHeader = memo(function StudioShellHeader({
  projectName,
  trackCount,
  isMobile,
  viewMode,
  onViewModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasUnsavedChanges,
  isSaving,
  isOfflineCapable,
  isOnline,
  autoSaveStatus,
  autoSaveLastSavedAt,
  autoSaveTimeSinceLastSave,
  onBack,
  onSave,
  onExport,
  onGenerate,
  onMixerOpen,
}: StudioShellHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0",
        isMobile && "sticky top-0 z-40",
      )}
    >
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-semibold truncate">{projectName}</h1>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {trackCount} дорожек
            </Badge>
            {!isMobile && (
              <AutoSaveIndicator
                status={autoSaveStatus}
                lastSavedAt={autoSaveLastSavedAt}
                timeSinceLastSave={autoSaveTimeSinceLastSave}
              />
            )}
          </div>
        </div>
      </div>

      {/* Center: View Switcher (desktop only) */}
      {!isMobile && (
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="timeline" className="h-7 px-2 gap-1">
              <Rows3 className="h-4 w-4" />
              <span className="hidden lg:inline">Дорожки</span>
            </TabsTrigger>
            <TabsTrigger value="mixer" className="h-7 px-2 gap-1">
              <Sliders className="h-4 w-4" />
              <span className="hidden lg:inline">Микшер</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Center: Quick actions for mobile */}
      {isMobile && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMixerOpen} title="Микшер">
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={onUndo} title="Отменить (Ctrl+Z)">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={onRedo} title="Повторить (Ctrl+Shift+Z)">
              <Redo2 className="h-4 w-4" />
            </Button>

            {isOfflineCapable && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  isOnline ? "text-muted-foreground" : "text-yellow-600 bg-yellow-500/10",
                )}
                title={isOnline ? "Онлайн" : "Офлайн режим"}
              >
                {isOnline ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
              </div>
            )}

            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Сохранить</span>
            </Button>

            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onGenerate}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Создать</span>
            </Button>

            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
          </>
        )}

        {isMobile && hasUnsavedChanges && (
          <Badge variant="secondary" className="text-[10px]">
            Не сохранено
          </Badge>
        )}
      </div>
    </header>
  );
});
