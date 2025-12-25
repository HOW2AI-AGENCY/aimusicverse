/**
 * Studio Shell
 * Main layout wrapper for the unified studio
 * Handles header, transport, view switching, and content areas
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStudioStore, ViewMode, StudioProject } from '@/stores/useUnifiedStudioStore';
import { StudioTransport } from './StudioTransport';
import { TrackLanesPanel } from './TrackLanesPanel';
import { StudioMixerPanel } from './StudioMixerPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Download,
  Undo2,
  Redo2,
  LayoutGrid,
  Rows3,
  Sliders,
  Plus,
  Loader2,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TRACK_COLORS, TrackType } from '@/stores/useUnifiedStudioStore';

interface StudioShellProps {
  className?: string;
}

export const StudioShell = memo(function StudioShell({ className }: StudioShellProps) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    viewMode,
    setViewMode,
    saveProject,
    canUndo,
    canRedo,
    undo,
    redo,
    addTrack,
  } = useUnifiedStudioStore();

  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showMixerSheet, setShowMixerSheet] = useState(false);

  // Handle save
  const handleSave = useCallback(async () => {
    const success = await saveProject();
    if (success) {
      toast.success('Проект сохранён');
    } else {
      toast.error('Ошибка сохранения');
    }
  }, [saveProject]);

  // Handle export (placeholder)
  const handleExport = useCallback(() => {
    toast.info('Экспорт пока недоступен');
  }, []);

  // Handle back
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('Есть несохранённые изменения. Выйти?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [hasUnsavedChanges, navigate]);

  // Handle add track
  const handleAddTrack = useCallback((type: TrackType, name: string) => {
    addTrack({
      name,
      type,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: TRACK_COLORS[type],
    });
    setShowAddTrackDialog(false);
    toast.success(`Добавлена дорожка: ${name}`);
  }, [addTrack]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Нет открытого проекта</p>
        <Button onClick={() => navigate('/studio')}>
          Открыть студию
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-semibold truncate">{project.name}</h1>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {project.status}
              </Badge>
              {hasUnsavedChanges ? (
                <CloudOff className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Cloud className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Center: View Switcher */}
        {!isMobile && (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="timeline" className="h-7 px-2 gap-1">
                <Rows3 className="h-4 w-4" />
                <span className="hidden lg:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="mixer" className="h-7 px-2 gap-1">
                <Sliders className="h-4 w-4" />
                <span className="hidden lg:inline">Mixer</span>
              </TabsTrigger>
              <TabsTrigger value="compact" className="h-7 px-2 gap-1">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden lg:inline">Compact</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canUndo()}
            onClick={undo}
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canRedo()}
            onClick={redo}
            title="Повторить (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMixerSheet(true)}
            >
              <Sliders className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleSave}
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
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        </div>
      </header>

      {/* Transport */}
      <StudioTransport compact={isMobile} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'timeline' && (
          <TrackLanesPanel onAddTrack={() => setShowAddTrackDialog(true)} />
        )}
        {viewMode === 'mixer' && (
          <StudioMixerPanel onAddTrack={() => setShowAddTrackDialog(true)} />
        )}
        {viewMode === 'compact' && (
          <div className="flex flex-col h-full">
            <TrackLanesPanel 
              className="flex-1" 
              onAddTrack={() => setShowAddTrackDialog(true)} 
            />
            <StudioMixerPanel 
              className="h-40 border-t border-border/50" 
              compact 
              onAddTrack={() => setShowAddTrackDialog(true)}
            />
          </div>
        )}
      </main>

      {/* Mobile Mixer Sheet */}
      <Sheet open={showMixerSheet} onOpenChange={setShowMixerSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Микшер</SheetTitle>
          </SheetHeader>
          <StudioMixerPanel 
            className="h-full pt-4" 
            onAddTrack={() => {
              setShowMixerSheet(false);
              setShowAddTrackDialog(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={showAddTrackDialog}
        onOpenChange={setShowAddTrackDialog}
        onAdd={handleAddTrack}
      />
    </div>
  );
});

// ============ Add Track Dialog ============

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: TrackType, name: string) => void;
}

function AddTrackDialog({ open, onOpenChange, onAdd }: AddTrackDialogProps) {
  const [type, setType] = useState<TrackType>('instrumental');
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setType('instrumental');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackName = name.trim() || getDefaultTrackName(type);
    onAdd(type, trackName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить дорожку</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Тип дорожки</Label>
            <Select value={type} onValueChange={(v) => setType(v as TrackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vocal">🎤 Вокал</SelectItem>
                <SelectItem value="instrumental">🎸 Инструментал</SelectItem>
                <SelectItem value="drums">🥁 Ударные</SelectItem>
                <SelectItem value="bass">🎸 Бас</SelectItem>
                <SelectItem value="sfx">✨ SFX / Эффекты</SelectItem>
                <SelectItem value="other">📁 Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getDefaultTrackName(type)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultTrackName(type: TrackType): string {
  const names: Record<TrackType, string> = {
    main: 'Main Track',
    vocal: 'Вокал',
    instrumental: 'Инструментал',
    stem: 'Stem',
    sfx: 'SFX',
    drums: 'Ударные',
    bass: 'Бас',
    other: 'Дорожка',
  };
  return names[type];
}
