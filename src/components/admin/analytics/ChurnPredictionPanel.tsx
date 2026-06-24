/**
 * Churn Prediction Panel
 * 
 * Displays users at risk of churning with actionable insights.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Coins,
  MessageSquare,
  Heart,
  Zap
} from 'lucide-react';
import { useChurnPrediction, type ChurnRiskUser } from '@/hooks/analytics/useChurnPrediction';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const RISK_COLORS = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

const RISK_LABELS = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

function ChurnScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-destructive';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className={cn('h-full rounded-full transition-all', getColor())}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function UserChurnCard({ user, expanded, onToggle }: { 
  user: ChurnRiskUser; 
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {user.username || `User ${user.user_id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.telegram_id ? `TG: ${user.telegram_id}` : 'Web user'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', RISK_COLORS[user.risk_level])}>
            {RISK_LABELS[user.risk_level]}
          </Badge>
          <span className="font-mono text-sm font-bold">
            {user.churn_score}%
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ChurnScoreBar score={user.churn_score} />

      {user.risk_factors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.risk_factors.map((factor, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {factor}
            </Badge>
          ))}
        </div>
      )}

      {expanded && (
        <div className="pt-2 border-t space-y-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-muted rounded">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">{user.generations_last_7d}</p>
                    <p className="text-[10px] text-muted-foreground">7д</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Генераций за 7 дней</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-muted rounded">
                    <Coins className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                    <p className="text-xs font-medium">{user.current_balance}</p>
                    <p className="text-[10px] text-muted-foreground">баланс</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Текущий баланс</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-muted rounded">
                    <Heart className="h-4 w-4 mx-auto mb-1 text-pink-500" />
                    <p className="text-xs font-medium">{user.total_likes_given}</p>
                    <p className="text-[10px] text-muted-foreground">лайков</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Лайков поставлено</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-muted rounded">
                    <MessageSquare className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-medium">{user.total_comments}</p>
                    <p className="text-[10px] text-muted-foreground">коммент.</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Комментариев</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-xs text-muted-foreground">
            <span>Неактивен: {user.days_since_last_activity} дней</span>
            <span className="mx-2">•</span>
            <span>Сессий: {user.total_sessions}</span>
            <span className="mx-2">•</span>
            <span>Глубина: {user.avg_session_depth.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChurnPredictionPanel() {
  const { users, summary, isLoading, refetch } = useChurnPrediction({
    limit: 50,
    minRiskLevel: 'medium',
  });
  
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Прогноз оттока
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Прогноз оттока
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-destructive/10 rounded">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold">{summary.byRisk.critical}</p>
              <p className="text-xs text-muted-foreground">Критических</p>
            </div>
            <div className="text-center p-2 bg-orange-500/10 rounded">
              <TrendingDown className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold">{summary.byRisk.high}</p>
              <p className="text-xs text-muted-foreground">Высоких</p>
            </div>
            <div className="text-center p-2 bg-yellow-500/10 rounded">
              <Users className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
              <p className="text-lg font-bold">{summary.byRisk.medium}</p>
              <p className="text-xs text-muted-foreground">Средних</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{summary.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Средний риск</p>
            </div>
          </div>
        )}

        {/* Users list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Нет пользователей с высоким риском оттока</p>
              </div>
            ) : (
              users.map(user => (
                <UserChurnCard
                  key={user.user_id}
                  user={user}
                  expanded={expandedUsers.has(user.user_id)}
                  onToggle={() => toggleUser(user.user_id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
