import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Shield, AlertTriangle } from 'lucide-react';
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
}

/**
 * Компактная версия заголовка формы генерации
 * Оптимизирована для экономии пространства - умещается в одну строку
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
}: GenerateFormHeaderCompactProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Balance Badge - compact */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {isAdmin ? (
              <Badge
                variant="outline"
                className="gap-0.5 px-1.5 py-0.5 cursor-help border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                aria-label={`API баланс: ${userBalance} кредитов`}
              >
                <Shield className="w-3 h-3" />
                <span className="font-semibold text-[10px]">{Math.floor(userBalance)}</span>
              </Badge>
            ) : (
              <Badge
                variant={canGenerate ? "secondary" : "destructive"}
                className="gap-0.5 px-1.5 py-0.5 cursor-help"
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

      {/* Mode Toggle - compact */}
      <div className="flex items-center p-0.5 rounded-md bg-muted">
        <Button
          variant={mode === 'simple' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('simple')}
          className="h-6 px-2 text-[10px] touch-manipulation"
        >
          Simple
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('custom')}
          className="h-6 px-2 text-[10px] touch-manipulation"
        >
          Custom
        </Button>
      </div>

      {/* Model Selector - compact */}
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="h-6 w-auto min-w-[70px] max-w-[100px] text-[10px] px-2">
          <SelectValue>
            <div className="flex items-center gap-1">
              <span className="text-xs">{SUNO_MODELS[model as keyof typeof SUNO_MODELS]?.emoji || '🎵'}</span>
              <span className="text-[10px] truncate">
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
