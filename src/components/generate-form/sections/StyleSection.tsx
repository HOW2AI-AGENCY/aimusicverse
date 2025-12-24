import { memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { FormFieldActions } from '@/components/ui/FormFieldActions';

interface StyleSectionProps {
  style: string;
  onStyleChange: (value: string) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
}

export const StyleSection = memo(function StyleSection({
  style,
  onStyleChange,
  onBoostStyle,
  boostLoading,
}: StyleSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor="style" className="text-xs font-medium">
          Стиль
        </Label>
        <div className="flex items-center gap-1">
          <FormFieldActions
            value={style}
            onClear={() => onStyleChange('')}
          />
          <VoiceInputButton
            onResult={onStyleChange}
            context="style"
            currentValue={style}
            appendMode
            className="h-6 w-6 p-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBoostStyle}
            disabled={boostLoading || !style}
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
        id="style"
        placeholder="Опишите стиль, жанр, настроение..."
        value={style}
        onChange={(e) => onStyleChange(e.target.value)}
        rows={3}
        className="resize-none text-sm"
      />
      <div className="flex justify-end mt-1">
        <span className={`text-xs ${style.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {style.length}/500
        </span>
      </div>
    </div>
  );
});
