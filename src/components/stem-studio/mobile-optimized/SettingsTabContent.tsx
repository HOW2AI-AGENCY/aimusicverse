/**
 * Settings Tab Content - Optimized for mobile
 * Contains all studio actions and settings in organized sections
 */

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, VolumeX, Sliders, Download, Share2,
  Scissors, Shuffle, Clock, Wand2, BrainCircuit,
  FileText, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsTabContentProps {
  // Master volume
  masterVolume: number;
  masterMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  
  // Effects
  effectsEnabled: boolean;
  onEnableEffects?: () => void;
  
  // Actions
  onTrim?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onSeparateStems?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onExportMix?: () => void;
  onMidiExport?: () => void;
  onReference?: () => void;
  onAnalysis?: () => void;
  
  // Availability flags
  hasSunoId?: boolean;
  hasStems?: boolean;
}

export function SettingsTabContent({
  masterVolume,
  masterMuted,
  onVolumeChange,
  onMuteToggle,
  effectsEnabled,
  onEnableEffects,
  onTrim,
  onRemix,
  onExtend,
  onSeparateStems,
  onDownload,
  onShare,
  onExportMix,
  onMidiExport,
  onReference,
  onAnalysis,
  hasSunoId,
  hasStems,
}: SettingsTabContentProps) {
  return (
    <div className="p-4 space-y-6 pb-6">
      {/* Master Volume Section */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Громкость
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              className={cn(
                "h-10 w-10 rounded-full shrink-0",
                masterMuted && "text-destructive"
              )}
            >
              {masterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Master</span>
                <span className="text-xs text-muted-foreground">{Math.round(masterVolume * 100)}%</span>
              </div>
              <Slider
                value={[masterVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onVolumeChange(v[0])}
                className="w-full"
                disabled={masterMuted}
              />
            </div>
          </div>
          
          {/* Effects Toggle */}
          {onEnableEffects && !effectsEnabled && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <Label className="text-sm cursor-pointer">Режим эффектов</Label>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onEnableEffects}
              >
                Включить
              </Button>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Track Actions */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Действия
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {onTrim && (
            <Button
              variant="outline"
              onClick={onTrim}
              className="h-11 justify-start gap-2"
            >
              <Scissors className="w-4 h-4" />
              <span className="text-sm">Обрезать</span>
            </Button>
          )}
          
          {onRemix && hasSunoId && (
            <Button
              variant="outline"
              onClick={onRemix}
              className="h-11 justify-start gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span className="text-sm">Ремикс</span>
            </Button>
          )}
          
          {onExtend && hasSunoId && (
            <Button
              variant="outline"
              onClick={onExtend}
              className="h-11 justify-start gap-2"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">Расширить</span>
            </Button>
          )}
          
          {onSeparateStems && !hasStems && (
            <Button
              variant="outline"
              onClick={onSeparateStems}
              className="h-11 justify-start gap-2"
            >
              <Music className="w-4 h-4" />
              <span className="text-sm">Стемы</span>
            </Button>
          )}
        </div>
      </section>

      <Separator />

      {/* Export & Share */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Экспорт
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {onDownload && (
            <Button
              variant="outline"
              onClick={onDownload}
              className="h-11 justify-start gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Скачать</span>
            </Button>
          )}
          
          {onShare && (
            <Button
              variant="outline"
              onClick={onShare}
              className="h-11 justify-start gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Поделиться</span>
            </Button>
          )}
          
          {onExportMix && hasStems && (
            <Button
              variant="outline"
              onClick={onExportMix}
              className="h-11 justify-start gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Экспорт микса</span>
            </Button>
          )}
          
          {onMidiExport && hasStems && (
            <Button
              variant="outline"
              onClick={onMidiExport}
              className="h-11 justify-start gap-2"
            >
              <Music className="w-4 h-4" />
              <span className="text-sm">MIDI</span>
            </Button>
          )}
        </div>
      </section>

      {/* Additional Actions */}
      {(onReference || onAnalysis) && (
        <>
          <Separator />
          <section>
            <h3 className="text-sm font-semibold mb-3">Дополнительно</h3>
            <div className="grid grid-cols-2 gap-2">
              {onReference && (
                <Button
                  variant="outline"
                  onClick={onReference}
                  className="h-11 justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Справка</span>
                </Button>
              )}
              
              {onAnalysis && (
                <Button
                  variant="outline"
                  onClick={onAnalysis}
                  className="h-11 justify-start gap-2"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-sm">Анализ</span>
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
