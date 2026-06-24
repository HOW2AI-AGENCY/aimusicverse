/**
 * User Journey Timeline - Visual representation of user actions
 * Shows typical paths users take through the app
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  UserPlus,
  Music,
  Layers,
  Share2,
  CreditCard,
  Trophy,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface JourneyStep {
  id: string;
  action: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  avgTime: string;
  completionRate: number;
}

interface UserJourney {
  id: string;
  name: string;
  description: string;
  users: number;
  percentage: number;
  steps: JourneyStep[];
  outcome: 'conversion' | 'churn' | 'active';
}

const JOURNEYS: UserJourney[] = [
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Быстрый путь к подписке',
    users: 847,
    percentage: 12,
    outcome: 'conversion',
    steps: [
      { id: 'reg', action: 'register', label: 'Регистрация', icon: UserPlus, avgTime: '0м', completionRate: 100 },
      { id: 'gen1', action: 'generate', label: '1-й трек', icon: Music, avgTime: '5м', completionRate: 100 },
      { id: 'gen2', action: 'generate', label: '2-3 трека', icon: Music, avgTime: '15м', completionRate: 100 },
      { id: 'stems', action: 'stems', label: 'Стемы', icon: Layers, avgTime: '8м', completionRate: 85 },
      { id: 'sub', action: 'subscribe', label: 'Подписка', icon: CreditCard, avgTime: '2м', completionRate: 100 },
    ],
  },
  {
    id: 'social-sharer',
    name: 'Social Sharer',
    description: 'Активный в шеринге',
    users: 1234,
    percentage: 18,
    outcome: 'active',
    steps: [
      { id: 'reg', action: 'register', label: 'Регистрация', icon: UserPlus, avgTime: '0м', completionRate: 100 },
      { id: 'gen1', action: 'generate', label: '1-й трек', icon: Music, avgTime: '8м', completionRate: 100 },
      { id: 'share', action: 'share', label: 'Поделился', icon: Share2, avgTime: '3м', completionRate: 100 },
      { id: 'gen2', action: 'generate', label: 'Ещё треки', icon: Music, avgTime: '20м', completionRate: 75 },
      { id: 'ach', action: 'achievement', label: 'Ачивка', icon: Trophy, avgTime: '1д', completionRate: 60 },
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Изучает функции',
    users: 2156,
    percentage: 31,
    outcome: 'active',
    steps: [
      { id: 'reg', action: 'register', label: 'Регистрация', icon: UserPlus, avgTime: '0м', completionRate: 100 },
      { id: 'browse', action: 'browse', label: 'Просмотр', icon: Music, avgTime: '12м', completionRate: 100 },
      { id: 'gen1', action: 'generate', label: '1-й трек', icon: Music, avgTime: '1д', completionRate: 65 },
      { id: 'wait', action: 'inactive', label: 'Пауза', icon: Clock, avgTime: '3д', completionRate: 45 },
      { id: 'return', action: 'return', label: 'Возврат', icon: ArrowRight, avgTime: '7д', completionRate: 30 },
    ],
  },
  {
    id: 'one-timer',
    name: 'One-Timer',
    description: 'Один визит',
    users: 2678,
    percentage: 39,
    outcome: 'churn',
    steps: [
      { id: 'reg', action: 'register', label: 'Регистрация', icon: UserPlus, avgTime: '0м', completionRate: 100 },
      { id: 'browse', action: 'browse', label: 'Просмотр', icon: Music, avgTime: '5м', completionRate: 100 },
      { id: 'leave', action: 'leave', label: 'Уход', icon: Clock, avgTime: '10м', completionRate: 100 },
    ],
  },
];

const OUTCOME_STYLES = {
  conversion: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', label: 'Конверсия' },
  active: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', label: 'Активный' },
  churn: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', label: 'Отток' },
};

interface JourneyCardProps {
  journey: UserJourney;
}

const JourneyCard = memo(function JourneyCard({ journey }: JourneyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const outcomeStyle = OUTCOME_STYLES[journey.outcome];

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-xl overflow-hidden transition-colors',
        outcomeStyle.border,
        isExpanded && outcomeStyle.bg
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors"
      >
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          outcomeStyle.bg
        )}>
          <span className="text-lg">{journey.percentage}%</span>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{journey.name}</span>
            <Badge variant="outline" className={cn('text-[10px] h-4', outcomeStyle.text)}>
              {outcomeStyle.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{journey.description}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-medium">{journey.users.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">пользователей</div>
        </div>

        <ChevronRight className={cn(
          'h-4 w-4 text-muted-foreground transition-transform shrink-0',
          isExpanded && 'rotate-90'
        )} />
      </button>

      {/* Steps timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t"
          >
            <ScrollArea className="w-full">
              <div className="p-3 flex items-center gap-2 min-w-max">
                {journey.steps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === journey.steps.length - 1;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center border-2',
                          step.completionRate >= 80 
                            ? 'border-green-500 bg-green-500/10' 
                            : step.completionRate >= 50 
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-muted-foreground/30 bg-muted/30'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium mt-1 max-w-[60px] text-center truncate">
                          {step.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {step.avgTime}
                        </span>
                        <span className={cn(
                          'text-[9px]',
                          step.completionRate >= 80 ? 'text-green-500' : 
                          step.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {step.completionRate}%
                        </span>
                      </div>

                      {!isLast && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export const UserJourneyTimeline = memo(function UserJourneyTimeline() {
  const [filter, setFilter] = useState<'all' | 'conversion' | 'active' | 'churn'>('all');

  const filteredJourneys = filter === 'all' 
    ? JOURNEYS 
    : JOURNEYS.filter(j => j.outcome === filter);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4" />
            User Journeys
          </CardTitle>

          <div className="flex gap-1">
            {(['all', 'conversion', 'active', 'churn'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Все' : OUTCOME_STYLES[f]?.label || f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredJourneys.map(journey => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});
