import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History, Sliders, Trash2, Coins, AlertTriangle } from 'lucide-react';
import { SUNO_MODELS } from '@/constants/sunoModels';

interface GenerateFormHeaderProps {
  userBalance: number;
  generationCost: number;
  canGenerate: boolean;
  apiCredits: number | null;
  mode: 'simple' | 'custom';
  onModeChange: (mode: 'simple' | 'custom') => void;
  model: string;
  onModelChange: (model: string) => void;
  hasDraft: boolean;
  onClearDraft: () => void;
  onOpenHistory: () => void;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
}

export function GenerateFormHeader({
  userBalance,
  generationCost,
  canGenerate,
  apiCredits,
  mode,
  onModeChange,
  model,
  onModelChange,
  hasDraft,
  onClearDraft,
  onOpenHistory,
  advancedOpen,
  onAdvancedOpenChange,
}: GenerateFormHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Credits, Mode Toggle, Settings */}
      <div className="flex items-center justify-between gap-2">
        {/* Left side: User Balance and History */}
        <div className="flex items-center gap-2 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={canGenerate ? "secondary" : "destructive"}
                  className="gap-1.5 px-2.5 py-1 cursor-help"
                  aria-label={`Ваш баланс: ${userBalance} кредитов`}
                >
                  {!canGenerate && <AlertTriangle className="w-3 h-3" />}
                  <Coins className="w-3.5 h-3.5" />
                  <span className="font-semibold text-xs">{userBalance}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Ваш баланс: {userBalance} кредитов</p>
                  <p className="text-muted-foreground">Стоимость генерации: {generationCost}</p>
                  {apiCredits !== null && (
                    <p className="text-muted-foreground border-t pt-1 mt-1">API баланс: {apiCredits.toFixed(0)}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation"
            title="История промптов"
            aria-label="Открыть историю промптов"
          >
            <History className="w-5 h-5" />
          </Button>
        </div>

        {/* Center: Mode Toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
          <Button
            variant={mode === 'simple' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('simple')}
            className="h-9 px-4 text-sm min-w-[72px] touch-manipulation"
          >
            Simple
          </Button>
          <Button
            variant={mode === 'custom' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('custom')}
            className="h-9 px-4 text-sm min-w-[72px] touch-manipulation"
          >
            Custom
          </Button>
        </div>

        {/* Right side: Advanced Settings + Clear Draft */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {hasDraft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearDraft}
              className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation text-muted-foreground hover:text-destructive"
              title="Очистить черновик"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAdvancedOpenChange(!advancedOpen)}
            className="h-11 w-11 p-0 min-w-[44px] min-h-[44px] touch-manipulation"
          >
            <Sliders className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: Model Selection */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground shrink-0">Модель:</Label>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="h-9 flex-1">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.emoji || '🎵'}</span>
                <span className="text-sm">{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.name || model}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {Object.entries(SUNO_MODELS).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{info.emoji}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{info.name}</span>
                    <span className="text-xs text-muted-foreground">{info.desc}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}