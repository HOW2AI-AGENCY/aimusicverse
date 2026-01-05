/**
 * FormFieldToolbar - Universal toolbar for form field actions
 * Provides copy, clear, voice input, AI assist, and custom actions
 */

import { memo, useState } from 'react';
import { 
  Copy, X, Save, Check, Loader2, Sparkles, Palette, 
  FileText, ExternalLink, Mic, LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormFieldToolbarProps {
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
  compact?: boolean;
  showSave?: boolean;
  showDivider?: boolean;
  className?: string;
}

// Subcomponent for individual toolbar buttons
interface ToolbarButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success';
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

const ToolbarButton = memo(function ToolbarButton({ 
  icon: Icon, 
  onClick, 
  variant = 'default',
  tooltip,
  disabled,
  className
}: ToolbarButtonProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 w-11 min-w-[44px] p-0",
        variant === 'primary' && "text-primary hover:text-primary/80 hover:bg-primary/10",
        variant === 'success' && "text-green-500",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  if (!tooltip) return button;

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

export const FormFieldToolbar = memo(function FormFieldToolbar({ 
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
  compact = false,
  showSave = false,
  showDivider = false,
  className
}: FormFieldToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const isEmpty = !value || value.trim() === '';
  
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
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const hasCustomActions = onOpenStyles || onOpenTemplates || onOpenStudio;
  const hasMainActions = true; // Copy/Clear always available

  return (
    <div className={cn(
      "flex items-center",
      compact ? "gap-0" : "gap-0.5",
      className
    )}>
      {/* Custom Actions - Styles, Templates, Studio */}
      {hasCustomActions && (
        <>
          {onOpenStyles && (
            <ToolbarButton 
              icon={Palette} 
              onClick={onOpenStyles}
              variant="primary"
              tooltip="Стили"
            />
          )}
          
          {onOpenTemplates && (
            <ToolbarButton 
              icon={FileText} 
              onClick={onOpenTemplates}
              tooltip="Шаблоны"
            />
          )}
          
          {onOpenStudio && (
            <ToolbarButton 
              icon={ExternalLink} 
              onClick={onOpenStudio}
              tooltip="Студия"
            />
          )}
          
          {showDivider && hasMainActions && (
            <Separator orientation="vertical" className="h-4 mx-0.5" />
          )}
        </>
      )}
      
      {/* Copy/Clear - only show when field has content */}
      {!isEmpty && (
        <>
          <ToolbarButton 
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            variant={copied ? 'success' : 'default'}
            tooltip="Копировать"
          />
          
          <ToolbarButton 
            icon={X}
            onClick={onClear}
            tooltip="Очистить"
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
          className={cn("h-11 w-11 min-w-[44px] p-0", isEmpty && "opacity-40")}
          title="Сохранить"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
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
          className="h-11 w-11 min-w-[44px] p-0"
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
            "h-11 gap-1 text-primary hover:text-primary/80 hover:bg-primary/10",
            aiLabel ? "px-3" : "px-0 w-11 min-w-[44px]"
          )}
        >
          {aiLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {aiLabel && <span className="text-xs font-medium">{aiLabel}</span>}
        </Button>
      )}
    </div>
  );
});
