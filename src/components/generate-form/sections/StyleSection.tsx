import { memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormFieldToolbar } from '../FormFieldToolbar';
import { SectionLabel, SECTION_HINTS } from '../SectionLabel';
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
    <div className="space-y-1.5">
      <SectionLabel 
        label="Стиль"
        htmlFor="style"
        hint={SECTION_HINTS.style}
      />
      
      {/* Textarea with bottom toolbar */}
      <div className="relative">
        <Textarea
          id="style"
          placeholder="Опишите стиль, жанр, настроение..."
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
          rows={3}
          className={cn(
            "resize-none text-sm pb-9 rounded-xl bg-muted/30 border-muted-foreground/20",
            "focus:border-primary/50 focus:ring-primary/20 transition-colors",
            style.length > 450 && "border-destructive focus:border-destructive"
          )}
        />
        
        {/* Bottom toolbar inside textarea */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
          {/* Character count */}
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-md bg-background/60 backdrop-blur-sm",
            style.length > 450 ? 'text-destructive font-medium' : 
            style.length > 350 ? 'text-yellow-500' : 'text-muted-foreground'
          )}>
            {style.length}/500
          </span>
          
          {/* Toolbar buttons */}
          <div className="flex items-center bg-background/60 backdrop-blur-sm rounded-md">
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
        </div>
      </div>
    </div>
  );
});