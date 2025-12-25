import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Music, Zap, Sparkles, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { GENRES, MOODS } from '@/lib/lyrics/constants';

export interface InstrumentalSettings {
  genre: string | null;
  mood: string | null;
  bpm: number;
  customStyle: string;
}

interface InstrumentalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (settings: InstrumentalSettings) => void;
  isProcessing?: boolean;
}

const DEFAULT_BPM = 120;

export const InstrumentalSettingsDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}: InstrumentalSettingsDialogProps) => {
  const [genre, setGenre] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [customStyle, setCustomStyle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfirm = () => {
    onConfirm({ genre, mood, bpm, customStyle });
  };

  const handleReset = () => {
    setGenre(null);
    setMood(null);
    setBpm(DEFAULT_BPM);
    setCustomStyle('');
  };

  const selectedGenre = GENRES.find(g => g.value === genre);
  const selectedMood = MOODS.find(m => m.value === mood);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Настройки инструментала
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Выберите стиль и параметры для AI-генерации
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Genre Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Music className="w-4 h-4 text-primary" />
                Жанр
              </Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <Badge
                    key={g.value}
                    variant={genre === g.value ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-105',
                      genre === g.value && 'ring-2 ring-primary/50'
                    )}
                    onClick={() => setGenre(genre === g.value ? null : g.value)}
                  >
                    <span className="mr-1">{g.emoji}</span>
                    {g.label}
                  </Badge>
                ))}
              </div>
              {selectedGenre && (
                <p className="text-xs text-muted-foreground">
                  {selectedGenre.labelEn} - подберём подходящие инструменты
                </p>
              )}
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Настроение
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOODS.slice(0, 10).map((m) => (
                  <Badge
                    key={m.value}
                    variant={mood === m.value ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-105',
                      mood === m.value && 'ring-2 ring-amber-500/50'
                    )}
                    onClick={() => setMood(mood === m.value ? null : m.value)}
                  >
                    <span className="mr-1">{m.emoji}</span>
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* BPM Slider */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Темп (BPM)
                </span>
                <span className="text-primary font-mono">{bpm}</span>
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[bpm]}
                  onValueChange={([value]) => setBpm(value)}
                  min={60}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>60 (медленно)</span>
                  <span>120</span>
                  <span>200 (быстро)</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[80, 100, 120, 140, 160].map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={bpm === preset ? 'secondary' : 'ghost'}
                    className="flex-1 h-7 text-xs"
                    onClick={() => setBpm(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Расширенные настройки
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label className="text-sm font-medium">
                    Дополнительные инструкции (опционально)
                  </Label>
                  <Textarea
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="Например: добавить акустическую гитару, мягкое пианино, без барабанов..."
                    className="min-h-[80px] text-sm"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customStyle.length}/200 символов
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            {(genre || mood || bpm !== DEFAULT_BPM) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-muted/50 border"
              >
                <p className="text-xs text-muted-foreground mb-2">Будет сгенерировано:</p>
                <p className="text-sm">
                  {selectedGenre ? `${selectedGenre.emoji} ${selectedGenre.label}` : 'Любой жанр'}
                  {selectedMood && ` • ${selectedMood.emoji} ${selectedMood.label}`}
                  {` • ${bpm} BPM`}
                </p>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isProcessing}
            className="sm:mr-auto"
          >
            Сбросить
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
                Генерация...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Сгенерировать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
