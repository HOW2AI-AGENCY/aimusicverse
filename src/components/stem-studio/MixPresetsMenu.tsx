/**
 * Mix Presets Menu
 * 
 * Dropdown menu for saving and loading mix presets
 */

import { useState } from 'react';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Plus,
  Check,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMixPresets } from '@/hooks/useMixPresets';
import { StemEffects } from '@/hooks/studio/stemEffectsConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface MixPresetsMenuProps {
  trackId: string;
  masterVolume: number;
  stemStates: Record<string, StemState>;
  stemEffects: Record<string, { effects: StemEffects } | undefined>;
  onLoadPreset: (preset: {
    masterVolume: number;
    stems: Record<string, { volume: number; muted: boolean; solo: boolean; effects: StemEffects }>;
  }) => void;
  effectsEnabled: boolean;
}

export function MixPresetsMenu({
  trackId,
  masterVolume,
  stemStates,
  stemEffects,
  onLoadPreset,
  effectsEnabled,
}: MixPresetsMenuProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const {
    presets,
    currentPreset,
    savePreset,
    quickSave,
    loadPreset,
    deletePreset,
  } = useMixPresets(trackId);

  const handleQuickSave = () => {
    quickSave(masterVolume, stemStates, stemEffects);
    toast.success('Микс сохранён');
  };

  const handleSaveAs = () => {
    if (!presetName.trim()) {
      toast.error('Введите название пресета');
      return;
    }
    
    savePreset(presetName.trim(), masterVolume, stemStates, stemEffects);
    toast.success(`Пресет "${presetName}" сохранён`);
    setSaveDialogOpen(false);
    setPresetName('');
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = loadPreset(presetId);
    if (preset) {
      onLoadPreset({
        masterVolume: preset.masterVolume,
        stems: preset.stems,
      });
      toast.success(`Пресет "${preset.name}" загружен`);
    }
  };

  const handleDeletePreset = (e: React.MouseEvent, presetId: string, name: string) => {
    e.stopPropagation();
    deletePreset(presetId);
    toast.success(`Пресет "${name}" удалён`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Пресеты</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Сохранить</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleQuickSave}>
            <Save className="w-4 h-4 mr-2" />
            Быстрое сохранение
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Сохранить как...
          </DropdownMenuItem>
          
          {presets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Загрузить пресет</DropdownMenuLabel>
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{preset.name}</span>
                        {currentPreset?.id === preset.id && (
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(preset.updatedAt), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeletePreset(e, preset.id, preset.name)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {presets.length === 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Нет сохранённых пресетов
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save As Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сохранить пресет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Название пресета</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Мой микс"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Будут сохранены: громкости стемов, mute/solo, 
              {effectsEnabled ? ' настройки EQ, компрессора и реверберации' : ' (эффекты выключены)'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveAs} disabled={!presetName.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
