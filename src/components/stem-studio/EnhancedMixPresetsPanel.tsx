/**
 * Enhanced Mix Presets Panel
 * 
 * Improved UI for mix presets with visual feedback and auto-save
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sliders, Save, RotateCcw, Check, Info } from 'lucide-react';
import { useMixPresets, MixPreset } from '@/hooks/studio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EnhancedMixPresetsPanelProps {
  trackId: string;
  stems: Array<{ id: string; stem_type: string }>;
  onLoadPreset: (preset: MixPreset) => void;
  hasUnsavedChanges?: boolean;
  compact?: boolean;
}

export function EnhancedMixPresetsPanel({
  trackId,
  stems,
  onLoadPreset,
  hasUnsavedChanges = false,
  compact = false,
}: EnhancedMixPresetsPanelProps) {
  const [showPresetDetails, setShowPresetDetails] = useState<MixPreset | null>(null);
  const { getAvailablePresets, loadSavedMix, clearSavedMix } = useMixPresets(trackId, stems);
  
  const availablePresets = getAvailablePresets();
  const savedMix = loadSavedMix();

  const handleLoadPreset = (preset: MixPreset) => {
    onLoadPreset(preset);
    toast.success(`Пресет "${preset.name}" применён`, {
      description: preset.description,
      icon: preset.icon,
    });
  };

  const handleLoadSaved = () => {
    if (savedMix) {
      // Convert saved mix to preset format
      const preset: MixPreset = {
        id: 'saved',
        name: 'Сохранённый микс',
        description: 'Ваш последний сохранённый микс',
        icon: '💾',
        masterVolume: savedMix.masterVolume,
        stems: savedMix.stemStates,
      };
      onLoadPreset(preset);
      toast.success('Сохранённый микс загружен');
    }
  };

  const handleClearSaved = () => {
    clearSavedMix();
    toast.info('Сохранённый микс удалён');
  };

  const handleShowDetails = (preset: MixPreset) => {
    setShowPresetDetails(preset);
  };

  if (compact) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5 relative",
                hasUnsavedChanges && "border-orange-500/50"
              )}
            >
              <Sliders className="w-4 h-4" />
              <span>Пресеты</span>
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Пресеты микса</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {savedMix && (
              <>
                <DropdownMenuItem
                  onClick={handleLoadSaved}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="font-medium">Сохранённый микс</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(savedMix.timestamp).toLocaleString('ru')}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Последний</Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {availablePresets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className="gap-2 cursor-pointer"
              >
                <span className="text-lg">{preset.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </div>
                </div>
                <Info
                  className="w-4 h-4 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowDetails(preset);
                  }}
                />
              </DropdownMenuItem>
            ))}

            {savedMix && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearSaved}
                  className="gap-2 text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  Удалить сохранённый
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Preset Details Dialog */}
        {showPresetDetails && (
          <Dialog open={!!showPresetDetails} onOpenChange={() => setShowPresetDetails(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{showPresetDetails.icon}</span>
                  {showPresetDetails.name}
                </DialogTitle>
                <DialogDescription>{showPresetDetails.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Настройки:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Мастер-громкость</span>
                      <span className="font-mono">{Math.round(showPresetDetails.masterVolume * 100)}%</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Настройки стемов:</span>
                      <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                        {Object.entries(showPresetDetails.stems).map(([stemId, config]) => {
                          const stem = stems.find(s => s.id === stemId);
                          if (!stem) return null;
                          
                          return (
                            <div key={stemId} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span className="text-xs font-medium">{stem.stem_type}</span>
                              <span className="text-xs font-mono">{Math.round(config.volume * 100)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    handleLoadPreset(showPresetDetails);
                    setShowPresetDetails(null);
                  }}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Применить пресет
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // Full layout for desktop
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Пресеты микса</h3>
        {hasUnsavedChanges && (
          <Badge variant="secondary" className="text-xs">
            Есть изменения
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {availablePresets.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            onClick={() => handleLoadPreset(preset)}
            className="h-auto py-3 px-3 justify-start text-left"
          >
            <div className="flex items-start gap-2 w-full">
              <span className="text-2xl shrink-0">{preset.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {preset.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {savedMix && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleLoadSaved}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Загрузить сохранённый
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSaved}
              className="shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Последнее сохранение: {new Date(savedMix.timestamp).toLocaleString('ru')}
          </p>
        </div>
      )}
    </div>
  );
}
