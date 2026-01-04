/**
 * QuickAccessPanel - Compact professional tools quick access
 * Can be used in different contexts (homepage, sidebar, studio)
 */

import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, Scissors, FileMusic, Sparkles, Activity,
  ArrowRight, Zap, Clock, CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  status?: 'available' | 'active' | 'completed';
  progress?: number;
}

interface QuickAccessPanelProps {
  variant?: 'compact' | 'expanded';
  showProgress?: boolean;
  className?: string;
  maxActions?: number;
}

const professionalActions: QuickAction[] = [
  {
    id: 'creative',
    label: 'Creative Tools',
    description: 'Chord Detection, Tab Editor',
    icon: Wand2,
    path: '/creative-tools',
    color: 'from-pink-500 to-purple-500',
    status: 'available',
  },
  {
    id: 'stems',
    label: 'Stem Studio',
    description: 'Separation & Mixing',
    icon: Scissors,
    path: '/library?tab=stems',
    color: 'from-cyan-500 to-blue-500',
    status: 'active',
    progress: 65,
  },
  {
    id: 'midi',
    label: 'MIDI Tools',
    description: 'Transcription & Sheets',
    icon: FileMusic,
    path: '/library',
    color: 'from-green-500 to-emerald-500',
    status: 'available',
  },
  {
    id: 'analysis',
    label: 'AI Analysis',
    description: 'BPM, Key, Structure',
    icon: Sparkles,
    path: '/library',
    color: 'from-amber-500 to-orange-500',
    status: 'completed',
  },
  {
    id: 'studio',
    label: 'Pro Studio',
    description: 'Full Professional Suite',
    icon: Activity,
    path: '/professional-studio',
    color: 'from-indigo-500 to-purple-500',
    status: 'available',
  },
];

const statusIcons = {
  available: ArrowRight,
  active: Zap,
  completed: CheckCircle,
};

const statusColors = {
  available: 'text-muted-foreground',
  active: 'text-primary animate-pulse',
  completed: 'text-green-400',
};

export function QuickAccessPanel({
  variant = 'compact',
  showProgress = true,
  className,
  maxActions = 5,
}: QuickAccessPanelProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const isCompact = variant === 'compact';

  const displayActions = professionalActions.slice(0, maxActions);

  const handleActionClick = (path: string) => {
    hapticFeedback?.('light');
    navigate(path);
  };

  return (
    <Card className={cn('border-2 border-primary/20', className)}>
      <CardContent className={cn('p-4', isCompact && 'p-3')}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className={cn('font-semibold', isCompact ? 'text-sm' : 'text-base')}>
                Professional Tools
              </h3>
              {!isCompact && (
                <p className="text-[10px] text-muted-foreground">
                  Quick access to all tools
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            PRO
          </Badge>
        </div>

        {/* Actions List */}
        <div className={cn('space-y-2', isCompact && 'space-y-1.5')}>
          {displayActions.map((action, index) => {
            const Icon = action.icon;
            const StatusIcon = statusIcons[action.status || 'available'];
            const hasProgress = action.status === 'active' && action.progress !== undefined;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full h-auto justify-start transition-all hover:bg-muted/50',
                    isCompact ? 'p-2' : 'p-3',
                    action.status === 'active' && 'bg-primary/5 border border-primary/20'
                  )}
                  onClick={() => handleActionClick(action.path)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Icon */}
                    <motion.div
                      className={cn(
                        'rounded-lg shrink-0',
                        `bg-gradient-to-br ${action.color}`,
                        isCompact ? 'p-1.5' : 'p-2'
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={cn('text-white', isCompact ? 'w-4 h-4' : 'w-5 h-5')} />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('font-medium', isCompact ? 'text-xs' : 'text-sm')}>
                          {action.label}
                        </span>
                        {action.status && (
                          <StatusIcon
                            className={cn(
                              'shrink-0',
                              isCompact ? 'w-3 h-3' : 'w-4 h-4',
                              statusColors[action.status]
                            )}
                          />
                        )}
                      </div>
                      {!isCompact && (
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {action.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      {hasProgress && showProgress && (
                        <div className="mt-2 space-y-1">
                          <Progress value={action.progress} className="h-1" />
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{action.progress}% завершено</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      className={cn(
                        'shrink-0 text-muted-foreground group-hover:text-primary transition-colors',
                        isCompact ? 'w-3 h-3' : 'w-4 h-4'
                      )}
                    />
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* View All Link */}
        {maxActions < professionalActions.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => handleActionClick('/professional-studio')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Открыть Professional Studio
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Footer Info */}
        {!isCompact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 pt-3 border-t border-border flex items-center gap-2"
          >
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              Все инструменты доступны в вашей профессиональной студии
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
