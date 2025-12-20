/**
 * AddTrackDrawer - UI for adding AI-generated stems to the track
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Plus, Loader2, Music2, Sparkles, Wand2, RefreshCw,
  Check, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  useContextualGeneration,
  StemType,
  stemTypeConfig,
  TrackContext,
} from '@/hooks/studio/useContextualGeneration';

interface AddTrackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackUrl: string;
  trackTitle?: string;
}

export function AddTrackDrawer({
  open,
  onOpenChange,
  trackId,
  trackUrl,
  trackTitle,
}: AddTrackDrawerProps) {
  const [selectedType, setSelectedType] = useState<StemType | null>(null);
  const [styleHint, setStyleHint] = useState('');

  const {
    trackContext,
    isLoadingContext,
    refetchContext,
    generateStem,
    isGenerating,
    generationProgress,
    lastGeneration,
  } = useContextualGeneration({ trackId, trackUrl });

  const handleGenerate = () => {
    if (!selectedType) return;
    
    generateStem({
      stemType: selectedType,
      styleHint: styleHint.trim() || undefined,
      duration: 30,
    });
  };

  const handleSuccess = () => {
    setSelectedType(null);
    setStyleHint('');
    onOpenChange(false);
  };

  // Check if generation just completed
  if (lastGeneration?.success && !isGenerating) {
    setTimeout(handleSuccess, 1500);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-h-[600px]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Добавить дорожку
          </SheetTitle>
          <SheetDescription>
            Сгенерировать новый инструмент, подходящий к треку
            {trackTitle && ` "${trackTitle}"`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Track Context */}
          <TrackContextCard 
            context={trackContext} 
            isLoading={isLoadingContext}
            onRefresh={refetchContext}
          />

          {/* Instrument Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Выберите инструмент
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(stemTypeConfig) as StemType[]).map((type) => {
                const config = stemTypeConfig[type];
                const isSelected = selectedType === type;
                const isSuggested = trackContext?.suggestedInstruments?.some(
                  i => i.toLowerCase().includes(type) || type.includes(i.toLowerCase())
                );
                
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    disabled={isGenerating}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                      "hover:bg-muted/50 active:scale-95",
                      isSelected 
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                        : "border-border/50",
                      isSuggested && !isSelected && "border-primary/30 bg-primary/5",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-xs font-medium">{config.label}</span>
                    {isSuggested && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        <Sparkles className="w-2 h-2 mr-0.5" />
                        Рек.
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Hint */}
          <AnimatePresence>
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5" />
                  Уточнение стиля (опционально)
                </label>
                <Textarea
                  value={styleHint}
                  onChange={(e) => setStyleHint(e.target.value)}
                  placeholder={`Например: "Мягкие арпеджио" или "Агрессивный грув"`}
                  className="resize-none h-20"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  {stemTypeConfig[selectedType].description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generation Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Генерация...</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Создаём {selectedType && stemTypeConfig[selectedType].label.toLowerCase()} 
                  {" "}с учётом контекста трека. Это может занять до 2 минут.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success State */}
          <AnimatePresence>
            {lastGeneration?.success && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Готово!</p>
                  <p className="text-xs text-muted-foreground">
                    Дорожка добавлена в студию
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || isGenerating}
            className="w-full h-12 gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Сгенерировать
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Track Context Card Component
function TrackContextCard({ 
  context, 
  isLoading,
  onRefresh,
}: { 
  context?: TrackContext; 
  isLoading: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Анализ трека...</span>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Контекст не загружен</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Анализ трека</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-6 w-6 p-0">
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {context.bpm && (
          <Badge variant="secondary" className="text-xs">
            🎵 {context.bpm} BPM
          </Badge>
        )}
        {context.key && (
          <Badge variant="secondary" className="text-xs">
            🎼 {context.key} {context.scale}
          </Badge>
        )}
        {context.genre && (
          <Badge variant="secondary" className="text-xs">
            🎸 {context.genre}
          </Badge>
        )}
        {context.mood && (
          <Badge variant="secondary" className="text-xs">
            💫 {context.mood}
          </Badge>
        )}
        {context.energy && (
          <Badge variant="secondary" className="text-xs">
            ⚡ {context.energy}
          </Badge>
        )}
      </div>

      {context.suggestedInstruments && context.suggestedInstruments.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-1.5">
            💡 Рекомендации:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {context.suggestedInstruments.slice(0, 4).map((inst) => (
              <Badge key={inst} variant="outline" className="text-xs text-primary border-primary/30">
                {inst}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
