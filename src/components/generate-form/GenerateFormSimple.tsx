import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Mic } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

interface GenerateFormSimpleProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
}

export function GenerateFormSimple({
  description,
  onDescriptionChange,
  title,
  onTitleChange,
  hasVocals,
  onHasVocalsChange,
  onBoostStyle,
  boostLoading,
}: GenerateFormSimpleProps) {
  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-3"
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="description" className="text-xs font-medium">
            Описание музыки
          </Label>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${description.length > 500 ? 'text-destructive font-medium' : description.length > 400 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {description.length}/500
            </span>
            <VoiceInputButton
              onResult={onDescriptionChange}
              context="description"
              currentValue={description}
              appendMode
              className="h-6 w-6 p-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBoostStyle}
              disabled={boostLoading || !description}
              className="h-6 px-2 gap-1"
            >
              {boostLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="text-xs">AI</span>
            </Button>
          </div>
        </div>
        <Textarea
          id="description"
          placeholder="Энергичный рок с мощными гитарами [Жанр: Рок] [Настроение: Драйв]"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={5}
          className={`resize-none text-sm ${description.length > 500 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {description.length > 500 && (
          <p className="text-xs text-destructive mt-1">
            Сократите описание или переключитесь в Custom режим
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="simple-title" className="text-xs font-medium mb-1.5 block">
          Название <span className="text-muted-foreground">(опционально)</span>
        </Label>
        <Input
          id="simple-title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Vocals Toggle for Simple Mode */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <Label htmlFor="simple-vocals-toggle" className="cursor-pointer text-sm font-medium">
            С вокалом
          </Label>
        </div>
        <Switch
          id="simple-vocals-toggle"
          checked={hasVocals}
          onCheckedChange={onHasVocalsChange}
        />
      </div>
    </motion.div>
  );
}