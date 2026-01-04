import { Copy, X, Save, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface FormFieldActionsProps {
  value: string;
  onClear: () => void;
  showSave?: boolean;
  onSave?: () => Promise<void>;
  className?: string;
  size?: 'sm' | 'default';
}

export function FormFieldActions({
  value,
  onClear,
  showSave = false,
  onSave,
  className,
  size = 'sm',
}: FormFieldActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEmpty = !value || value.trim() === '';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  const handleCopy = async () => {
    if (isEmpty) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Скопировано');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Ошибка копирования');
    }
  };

  const handleSave = async () => {
    if (isEmpty || !onSave) return;
    
    setSaving(true);
    try {
      await onSave();
      toast.success('Сохранено в библиотеку');
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Copy Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        disabled={isEmpty}
        className={cn(buttonSize, 'p-0')}
        title="Копировать"
      >
        {copied ? (
          <Check className={cn(iconSize, 'text-green-500')} />
        ) : (
          <Copy className={cn(iconSize, isEmpty && 'opacity-40')} />
        )}
      </Button>

      {/* Clear Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClear}
        disabled={isEmpty}
        className={cn(buttonSize, 'p-0')}
        title="Очистить"
      >
        <X className={cn(iconSize, isEmpty && 'opacity-40')} />
      </Button>

      {/* Save Button (optional) */}
      {showSave && onSave && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isEmpty || saving}
          className={cn(buttonSize, 'p-0')}
          title="Сохранить в библиотеку"
        >
          {saving ? (
            <Loader2 className={cn(iconSize, 'animate-spin')} />
          ) : (
            <Save className={cn(iconSize, isEmpty && 'opacity-40')} />
          )}
        </Button>
      )}
    </div>
  );
}