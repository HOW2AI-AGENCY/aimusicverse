import { memo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormFieldToolbar } from '../FormFieldToolbar';
import { cn } from '@/lib/utils';

interface StyleSectionProps {
  style: string;
  onStyleChange: (value: string) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
  onOpenStyles?: () => void;
}

export const StyleSection = memo(function StyleSection({
  style,
  onStyleChange,
  onBoostStyle,
  boostLoading,
  onOpenStyles,
}: StyleSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor="style" className="text-xs font-medium">
          Стиль
        </Label>
        <FormFieldToolbar
          value={style}
          onClear={() => onStyleChange('')}
          onVoiceInput={onStyleChange}
          voiceContext="style"
          appendMode
          onAIAssist={onBoostStyle}
          aiLoading={boostLoading}
          aiLabel="AI"
          onOpenStyles={onOpenStyles}
          compact
        />
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
        <span className={cn(
          "text-xs",
          style.length > 450 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {style.length}/500
        </span>
      </div>
    </div>
  );
});
