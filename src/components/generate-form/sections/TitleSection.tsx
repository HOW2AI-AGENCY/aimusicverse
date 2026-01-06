import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { FormFieldActions } from '@/components/ui/FormFieldActions';
import { SectionLabel, SECTION_HINTS } from '../SectionLabel';

interface TitleSectionProps {
  title: string;
  onTitleChange: (value: string) => void;
}

export const TitleSection = memo(function TitleSection({
  title,
  onTitleChange,
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel 
          label="Название"
          htmlFor="title"
          hint={SECTION_HINTS.title}
          suffix="(опционально)"
        />
        <FormFieldActions
          value={title}
          onClear={() => onTitleChange('')}
        />
      </div>
      <Input
        id="title"
        placeholder="Автогенерация если пусто"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="min-h-[44px] text-sm rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
      />
    </div>
  );
});