import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { History, Coins, Sparkles } from 'lucide-react';

interface GenerateFormHeaderCompactProps {
  userBalance: number;
  generationCost: number;
  mode: 'simple' | 'custom';
  onModeChange: (mode: 'simple' | 'custom') => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isAdmin?: boolean;
  apiBalance?: number;
  onOpenHistory?: () => void;
}

const MODELS = [
  { id: 'V4', name: 'V4', emoji: '🎵', description: 'Стабильная' },
  { id: 'V4_5', name: 'V4.5', emoji: '✨', description: 'Улучшенная' },
  { id: 'V4_5PLUS', name: 'V4.5+', emoji: '🚀', description: 'Максимальная' },
];

/**
 * Компактный заголовок формы генерации
 * Содержит: история, баланс, режим, модель
 */
export function GenerateFormHeaderCompact({
  userBalance,
  generationCost,
  mode,
  onModeChange,
  selectedModel,
  onModelChange,
  isAdmin = false,
  apiBalance = 0,
  onOpenHistory,
}: GenerateFormHeaderCompactProps) {
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const hasEnoughBalance = userBalance >= generationCost;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-2">
        {/* Левая часть: История + Баланс */}
        <div className="flex items-center gap-1.5">
          {/* Кнопка истории */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 min-w-[36px] min-h-[36px] touch-manipulation"
                onClick={onOpenHistory}
              >
                <History className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>История генераций</p>
            </TooltipContent>
          </Tooltip>

          {/* Баланс */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={hasEnoughBalance ? 'secondary' : 'destructive'}
                className="h-7 px-2 py-1 text-xs font-medium cursor-help"
              >
                {isAdmin ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>API: {apiBalance.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5 mr-1" />
                    <span>{userBalance}</span>
                    <span className="mx-1 opacity-50">/</span>
                    <span className="opacity-70">-{generationCost}</span>
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isAdmin ? (
                <p>API баланс системы</p>
              ) : (
                <p>Ваш баланс: {userBalance} кредитов. Стоимость: {generationCost}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Правая часть: Режим + Модель */}
        <div className="flex items-center gap-1.5">
          {/* Переключатель режима */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <Button
              type="button"
              variant={mode === 'simple' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 min-w-[56px] text-xs font-medium rounded-md"
              onClick={() => onModeChange('simple')}
            >
              Простой
            </Button>
            <Button
              type="button"
              variant={mode === 'custom' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 min-w-[56px] text-xs font-medium rounded-md"
              onClick={() => onModeChange('custom')}
            >
              Свой
            </Button>
          </div>

          {/* Селектор модели */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 min-w-[48px] text-xs font-medium"
                onClick={() => {
                  const currentIndex = MODELS.findIndex(m => m.id === selectedModel);
                  const nextIndex = (currentIndex + 1) % MODELS.length;
                  onModelChange(MODELS[nextIndex].id);
                }}
              >
                <span className="text-sm">{currentModel.emoji}</span>
                <span className="hidden sm:inline ml-1">{currentModel.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{currentModel.name} — {currentModel.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
