import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Shield, AlertTriangle, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SUNO_MODELS } from '@/constants/sunoModels';

interface GenerateFormHeaderCompactProps {
  userBalance: number;
  generationCost: number;
  canGenerate: boolean;
  apiCredits: number | null;
  mode: 'simple' | 'custom';
  onModeChange: (mode: 'simple' | 'custom') => void;
  model: string;
  onModelChange: (model: string) => void;
  isAdmin?: boolean;
  onOpenHistory?: () => void;
}

/**
 * Компактная версия заголовка формы генерации
 * Mobile-first дизайн с адаптивными элементами
 */
export function GenerateFormHeaderCompact({
  userBalance,
  generationCost,
  canGenerate,
  apiCredits,
  mode,
  onModeChange,
  model,
  onModelChange,
  isAdmin = false,
  onOpenHistory,
}: GenerateFormHeaderCompactProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
      {/* History Button - icon only */}
      {onOpenHistory && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onOpenHistory}
                className="h-7 w-7 shrink-0 touch-manipulation"
              >
                <History className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="text-xs">История промптов</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Balance Badge - compact */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {isAdmin ? (
              <Badge
                variant="outline"
                className="gap-0.5 px-1.5 py-0.5 h-6 cursor-help border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0"
                aria-label={`API баланс: ${userBalance} кредитов`}
              >
                <Shield className="w-3 h-3" />
                <span className="font-semibold text-[10px]">{Math.floor(userBalance)}</span>
              </Badge>
            ) : (
              <Badge
                variant={canGenerate ? "secondary" : "destructive"}
                className="gap-0.5 px-1.5 py-0.5 h-6 cursor-help shrink-0"
                aria-label={`Ваш баланс: ${userBalance} кредитов`}
              >
                {!canGenerate && <AlertTriangle className="w-3 h-3" />}
                <Coins className="w-3 h-3" />
                <span className="font-semibold text-[10px]">{userBalance}</span>
              </Badge>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <div className="space-y-1 text-xs">
              {isAdmin ? (
                <>
                  <p className="font-medium flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-amber-500" />
                    Режим администратора
                  </p>
                  <p className="text-muted-foreground">
                    API баланс: {Math.floor(userBalance)} кредитов
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Баланс: {userBalance} кредитов</p>
                  <p className="text-muted-foreground">Стоимость: {generationCost}</p>
                  {apiCredits !== null && (
                    <p className="text-muted-foreground border-t pt-1 mt-1">
                      API: {apiCredits.toFixed(0)}
                    </p>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mode Toggle - compact pill design */}
      <div className="flex items-center p-0.5 rounded-full bg-muted/60 shrink-0">
        <Button
          variant={mode === 'simple' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('simple')}
          className={`h-6 px-2.5 text-[10px] rounded-full touch-manipulation ${
            mode === 'simple' ? 'shadow-sm' : 'hover:bg-transparent'
          }`}
        >
          Simple
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('custom')}
          className={`h-6 px-2.5 text-[10px] rounded-full touch-manipulation ${
            mode === 'custom' ? 'shadow-sm' : 'hover:bg-transparent'
          }`}
        >
          Custom
        </Button>
      </div>

      {/* Model Selector - emoji only on mobile, full on desktop */}
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="h-6 w-auto min-w-[40px] sm:min-w-[80px] text-[10px] px-1.5 sm:px-2 shrink-0 rounded-full">
          <SelectValue>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="text-sm">{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.emoji || '🎵'}</span>
              <span className="text-[10px] truncate hidden sm:inline">
                {SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.name || model}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {Object.entries(SUNO_MODELS).map(([key, info]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{info.emoji}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{info.name}</span>
                  <span className="text-xs text-muted-foreground">{info.desc}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
