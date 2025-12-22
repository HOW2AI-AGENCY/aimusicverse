/**
 * UpgradePrompt - Display upgrade CTA for premium features
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureKey } from '@/hooks/useFeatureAccess';

interface UpgradePromptProps {
  feature: FeatureKey;
  requiredTier: string;
  compact?: boolean;
  className?: string;
}

const FEATURE_NAMES: Record<FeatureKey, string> = {
  model_v4: 'Модель V4',
  model_v4_5all: 'Модель V4.5',
  model_v4_5plus: 'Модель V4.5+',
  model_v5: 'Модель V5',
  stem_separation_basic: 'Базовое разделение',
  stem_separation_detailed: 'Детальное разделение стемов',
  section_replace: 'Замена секций',
  midi_transcription: 'Транскрипция MIDI',
  guitar_studio: 'Guitar Studio',
  prompt_dj: 'PromptDJ Mixer',
  lyrics_ai_agent: 'AI агент лирики',
  vocal_recording: 'Запись вокала',
  mastering: 'Мастеринг',
  api_access: 'API доступ',
};

const TIER_NAMES: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export function UpgradePrompt({ 
  feature, 
  requiredTier, 
  compact = false,
  className 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const featureName = FEATURE_NAMES[feature] || feature;
  const tierName = TIER_NAMES[requiredTier] || requiredTier;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20",
        className
      )}>
        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">
          Требуется <span className="text-amber-500 font-medium">{tierName}</span>
        </span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 px-2 text-xs text-amber-500 hover:text-amber-400"
          onClick={() => navigate('/subscription')}
        >
          Улучшить
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-sm">
              {featureName}
            </h4>
            <p className="text-xs text-muted-foreground">
              Эта функция доступна в тарифе <span className="text-amber-500 font-medium">{tierName}</span> и выше
            </p>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => navigate('/subscription')}
            >
              Улучшить тариф
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
