/**
 * ProfessionalDashboard - Central hub for professional musicians
 * Provides quick access to all professional tools, workflows, and analytics
 */

import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Music, Scissors, FileMusic, Sparkles, Guitar, 
  Piano, Wand2, Activity, TrendingUp, Clock,
  Zap, ArrowRight, Download, Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface WorkflowStep {
  id: string;
  title: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  description: string;
}

interface ProfessionalDashboardProps {
  className?: string;
}

const professionalWorkflows = [
  {
    id: 'music-creation',
    title: 'Создание музыки',
    icon: Music,
    color: 'from-pink-500 to-purple-500',
    steps: [
      { id: '1', title: 'AI Generation', icon: Sparkles, status: 'completed' as const, description: 'Генерация трека' },
      { id: '2', title: 'Stem Separation', icon: Scissors, status: 'current' as const, description: 'Разделение на стемы' },
      { id: '3', title: 'Professional Mix', icon: Sliders, status: 'pending' as const, description: 'Микширование' },
      { id: '4', title: 'Export', icon: Download, status: 'pending' as const, description: 'Экспорт финального трека' },
    ],
    progress: 50,
    estimatedTime: '2-3 min',
  },
  {
    id: 'midi-workflow',
    title: 'MIDI Workflow',
    icon: Piano,
    color: 'from-green-500 to-emerald-500',
    steps: [
      { id: '1', title: 'Audio Track', icon: Music, status: 'completed' as const, description: 'Исходный трек' },
      { id: '2', title: 'MIDI Transcription', icon: FileMusic, status: 'current' as const, description: 'Конвертация в MIDI' },
      { id: '3', title: 'Sheet Music', icon: FileMusic, status: 'pending' as const, description: 'Генерация нот' },
      { id: '4', title: 'Guitar Tabs', icon: Guitar, status: 'pending' as const, description: 'Табулатуры' },
    ],
    progress: 25,
    estimatedTime: '1-2 min',
  },
  {
    id: 'creative-tools',
    title: 'Creative Process',
    icon: Wand2,
    color: 'from-amber-500 to-orange-500',
    steps: [
      { id: '1', title: 'Chord Detection', icon: Activity, status: 'completed' as const, description: 'Распознавание аккордов' },
      { id: '2', title: 'Tab Editor', icon: Guitar, status: 'current' as const, description: 'Создание табулатур' },
      { id: '3', title: 'Melody Mixer', icon: Music, status: 'pending' as const, description: 'Создание мелодий' },
      { id: '4', title: 'Generate Track', icon: Sparkles, status: 'pending' as const, description: 'AI генерация' },
    ],
    progress: 40,
    estimatedTime: '3-5 min',
  },
];

const quickStats = [
  { label: 'Треков создано', value: '24', icon: Music, color: 'text-pink-400' },
  { label: 'Стемов разделено', value: '156', icon: Scissors, color: 'text-cyan-400' },
  { label: 'MIDI файлов', value: '18', icon: FileMusic, color: 'text-green-400' },
  { label: 'Времени в студии', value: '12ч', icon: Clock, color: 'text-amber-400' },
];

export function ProfessionalDashboard({ className }: ProfessionalDashboardProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handleWorkflowClick = (workflowId: string) => {
    hapticFeedback?.('light');
    
    switch (workflowId) {
      case 'music-creation':
        navigate('/generate');
        break;
      case 'midi-workflow':
        navigate('/library');
        break;
      case 'creative-tools':
        navigate('/creative-tools');
        break;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Профессиональная студия</h2>
            <p className="text-sm text-muted-foreground">
              Полный контроль над творческим процессом
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="border-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-3 space-y-1">
                  <Icon className={cn('w-4 h-4', stat.color)} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Professional Workflows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Активные рабочие процессы</h3>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            В процессе
          </Badge>
        </div>

        <div className="space-y-3">
          {professionalWorkflows.map((workflow, workflowIndex) => {
            const WorkflowIcon = workflow.icon;
            
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + workflowIndex * 0.1 }}
              >
                <Card 
                  className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/30 overflow-hidden"
                  onClick={() => handleWorkflowClick(workflow.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={cn(
                            'p-2 rounded-lg shrink-0',
                            `bg-gradient-to-br ${workflow.color}`
                          )}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <WorkflowIcon className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-base">{workflow.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                              {workflow.progress}%
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {workflow.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Progress Bar */}
                    <Progress value={workflow.progress} className="h-2" />

                    {/* Workflow Steps */}
                    <div className="grid grid-cols-4 gap-2">
                      {workflow.steps.map((step) => {
                        const StepIcon = step.icon;
                        const isCompleted = step.status === 'completed';
                        const isCurrent = step.status === 'current';
                        const isPending = step.status === 'pending';

                        return (
                          <div
                            key={step.id}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <motion.div
                              className={cn(
                                'p-2 rounded-lg transition-all',
                                isCompleted && 'bg-green-500/20 border-2 border-green-500/40',
                                isCurrent && 'bg-primary/20 border-2 border-primary/40 animate-pulse',
                                isPending && 'bg-muted border-2 border-border'
                              )}
                              animate={isCurrent ? {
                                scale: [1, 1.05, 1],
                              } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <StepIcon
                                className={cn(
                                  'w-4 h-4',
                                  isCompleted && 'text-green-400',
                                  isCurrent && 'text-primary',
                                  isPending && 'text-muted-foreground'
                                )}
                              />
                            </motion.div>
                            <div className="text-center">
                              <div className="text-[10px] font-medium leading-tight">
                                {step.title}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current Step Info */}
                    {workflow.steps.map((step) => {
                      if (step.status !== 'current') return null;
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <Zap className="w-3 h-3 text-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">
                            {step.description}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/20"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground text-center">
          Все инструменты профессиональной студии всегда под рукой
        </p>
      </motion.div>
    </div>
  );
}
