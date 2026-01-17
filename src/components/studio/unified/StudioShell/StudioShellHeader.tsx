/**
 * Studio Shell Header
 * Header component for the studio shell with navigation, tabs, and actions
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoSaveIndicator } from '../AutoSaveIndicator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Download,
  Undo2,
  Redo2,
  Sliders,
  Loader2,
  Cloud,
  CloudOff,
  Sparkles,
  Layers,
  FileText,
  Rows3,
} from 'lucide-react';
import type { ViewMode } from '@/stores/useUnifiedStudioStore';
import type { AutoSaveStatus } from '@/hooks/studio/useAutoSave';

interface StudioShellHeaderProps {
  projectName: string;
  trackCount: number;
  isMobile: boolean;
  viewMode: ViewMode;
  mobileTab: 'tracks' | 'lyrics';
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isOnline: boolean;
  isOfflineCapable: boolean;
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: string | null;
  timeSinceLastSave: number | null;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  onGenerate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onMobileTabChange: (tab: 'tracks' | 'lyrics') => void;
}

export const StudioShellHeader = memo(function StudioShellHeader({
  projectName,
  trackCount,
  isMobile,
  viewMode,
  mobileTab,
  isSaving,
  hasUnsavedChanges,
  isOnline,
  isOfflineCapable,
  autoSaveStatus,
  lastSavedAt,
  timeSinceLastSave,
  canUndo,
  canRedo,
  onBack,
  onSave,
  onExport,
  onGenerate,
  onUndo,
  onRedo,
  onViewModeChange,
  onMobileTabChange,
}: StudioShellHeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0",
      isMobile && "sticky top-0 z-40"
    )}>
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
                lastSavedAt={lastSavedAt}
                timeSinceLastSave={timeSinceLastSave}
              />
            )}
          </div>
        </div>
      </div>

      {/* Center: Desktop View Mode Tabs */}
      {!isMobile && (
        <Tabs 
          value={viewMode} 
          onValueChange={(v) => onViewModeChange(v as ViewMode)} 
          className="w-auto"
        >
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

      {/* Center: Mobile Tab Switcher */}
      {isMobile && (
        <Tabs 
          value={mobileTab} 
          onValueChange={(v) => onMobileTabChange(v as 'tracks' | 'lyrics')} 
          className="w-auto"
        >
          <TabsList className="h-8">
            <TabsTrigger value="tracks" className="h-7 px-2 gap-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs">Дорожки</span>
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="h-7 px-2 gap-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Текст</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canUndo}
              onClick={onUndo}
              title="Отменить (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canRedo}
              onClick={onRedo}
              title="Повторить (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            {/* Offline/Online indicator */}
            {isOfflineCapable && (
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  isOnline 
                    ? "text-muted-foreground" 
                    : "text-yellow-600 bg-yellow-500/10"
                )}
                title={isOnline ? "Онлайн" : "Офлайн режим"}
              >
                {isOnline ? (
                  <Cloud className="h-3 w-3" />
                ) : (
                  <CloudOff className="h-3 w-3" />
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Сохранить</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={onGenerate}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Создать</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
          </>
        )}

        {/* Mobile: simple save indicator */}
        {isMobile && hasUnsavedChanges && (
          <Badge variant="secondary" className="text-[10px]">
            Не сохранено
          </Badge>
        )}
      </div>
    </header>
  );
});
