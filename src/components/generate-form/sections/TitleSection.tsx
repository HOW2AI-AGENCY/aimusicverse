import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormFieldActions } from '@/components/ui/FormFieldActions';

interface TitleSectionProps {
  title: string;
  onTitleChange: (value: string) => void;
}

export const TitleSection = memo(function TitleSection({
  title,
  onTitleChange,
}: TitleSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor="title" className="text-xs font-medium">
          Название
        </Label>
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
        className="h-9 text-sm"
      />
    </div>
  );
});
