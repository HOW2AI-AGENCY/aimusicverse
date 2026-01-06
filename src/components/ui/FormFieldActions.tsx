/**
 * FormFieldActions - Universal toolbar for form field actions
 * Unified component replacing both FormFieldActions and FormFieldToolbar
 * Provides copy, clear, voice input, AI assist, and custom actions
 */

import { memo, useState } from 'react';
import { 
  Copy, X, Save, Check, Loader2, Sparkles, Palette, 
  FileText, ExternalLink, LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormFieldActionsProps {
  // Field value for copy/clear
  value: string;
  onClear: () => void;
  
  // Voice input
  onVoiceInput?: (text: string) => void;
  voiceContext?: 'style' | 'lyrics' | 'description';
  appendMode?: boolean;
  
  // AI actions
  onAIAssist?: () => void;
  aiLoading?: boolean;
  aiLabel?: string; // 'AI' | 'AI Boost' | null for icon only
  
  // Custom actions
  onOpenStyles?: () => void;
  onOpenTemplates?: () => void;
  onOpenStudio?: () => void;
  onSave?: () => Promise<void>;
  
  // Display options
  size?: 'sm' | 'default' | 'lg'; // sm=compact, default=medium, lg=44px touch targets
  showSave?: boolean;
  showDivider?: boolean;
  hideWhenEmpty?: boolean; // Hide Copy/Clear when empty (default for lg size)
  className?: string;
}

// Subcomponent for individual toolbar buttons with tooltips
interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success';
  tooltip?: string;
  disabled?: boolean;
  size: 'sm' | 'default' | 'lg';
  className?: string;
}

const ActionButton = memo(function ActionButton({ 
  icon: Icon, 
  onClick, 
  variant = 'default',
  tooltip,
  disabled,
  size,
  className
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-11 w-11 min-w-[44px]'
  };
  
  const iconClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-4 h-4'
  };

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        'p-0',
        variant === 'primary' && 'text-primary hover:text-primary/80 hover:bg-primary/10',
        variant === 'success' && 'text-green-500',
        className
      )}
    >
      <Icon className={iconClasses[size]} />
    </Button>
  );

  // Only show tooltips for lg size (touch-friendly)
  if (!tooltip || size !== 'lg') return button;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export const FormFieldActions = memo(function FormFieldActions({
  value,
  onClear,
  onVoiceInput,
  voiceContext,
  appendMode,
  onAIAssist,
  aiLoading,
  aiLabel,
  onOpenStyles,
  onOpenTemplates,
  onOpenStudio,
  onSave,
  size = 'sm',
  showSave = false,
  showDivider = false,
  hideWhenEmpty,
  className,
}: FormFieldActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEmpty = !value || value.trim() === '';
  // For lg size, hide copy/clear when empty by default
  const shouldHideWhenEmpty = hideWhenEmpty ?? size === 'lg';
  const hasCustomActions = onOpenStyles || onOpenTemplates || onOpenStudio;

  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-11 w-11 min-w-[44px]'
  };
  
  const iconClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-4 h-4'
  };

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

  // Check if we should show copy/clear buttons
  const showCopyClear = !shouldHideWhenEmpty || !isEmpty;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Custom Actions - Styles, Templates, Studio */}
      {hasCustomActions && (
        <>
          {onOpenStyles && (
            <ActionButton 
              icon={Palette} 
              onClick={onOpenStyles}
              variant="primary"
              tooltip="Стили"
              size={size}
            />
          )}
          
          {onOpenTemplates && (
            <ActionButton 
              icon={FileText} 
              onClick={onOpenTemplates}
              tooltip="Шаблоны"
              size={size}
            />
          )}
          
          {onOpenStudio && (
            <ActionButton 
              icon={ExternalLink} 
              onClick={onOpenStudio}
              tooltip="Студия"
              size={size}
            />
          )}
          
          {showDivider && showCopyClear && (
            <Separator orientation="vertical" className="h-4 mx-0.5" />
          )}
        </>
      )}
      
      {/* Copy/Clear */}
      {showCopyClear && (
        <>
          <ActionButton 
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            variant={copied ? 'success' : 'default'}
            tooltip="Копировать"
            disabled={isEmpty}
            size={size}
            className={isEmpty && !shouldHideWhenEmpty ? 'opacity-40' : undefined}
          />
          
          <ActionButton 
            icon={X}
            onClick={onClear}
            tooltip="Очистить"
            disabled={isEmpty}
            size={size}
            className={isEmpty && !shouldHideWhenEmpty ? 'opacity-40' : undefined}
          />
        </>
      )}
      
      {/* Save Button */}
      {showSave && onSave && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isEmpty || saving}
          className={cn(sizeClasses[size], 'p-0', isEmpty && 'opacity-40')}
          title="Сохранить в библиотеку"
        >
          {saving ? (
            <Loader2 className={cn(iconClasses[size], 'animate-spin')} />
          ) : (
            <Save className={iconClasses[size]} />
          )}
        </Button>
      )}
      
      {/* Voice Input */}
      {onVoiceInput && (
        <VoiceInputButton
          onResult={onVoiceInput}
          context={voiceContext}
          currentValue={value}
          appendMode={appendMode}
          className={cn(sizeClasses[size], 'p-0')}
        />
      )}
      
      {/* AI Button */}
      {onAIAssist && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAIAssist}
          disabled={aiLoading}
          className={cn(
            sizeClasses[size],
            'gap-1 text-primary hover:text-primary/80 hover:bg-primary/10',
            aiLabel ? 'px-3 w-auto' : 'px-0'
          )}
        >
          {aiLoading ? (
            <Loader2 className={cn(iconClasses[size], 'animate-spin')} />
          ) : (
            <Sparkles className={iconClasses[size]} />
          )}
          {aiLabel && <span className="text-xs font-medium">{aiLabel}</span>}
        </Button>
      )}
    </div>
  );
});

// Re-export for backward compatibility
export { FormFieldActions as FormFieldToolbar };
