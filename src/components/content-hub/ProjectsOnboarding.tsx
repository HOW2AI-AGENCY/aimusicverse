/**
 * Onboarding component for the Projects page
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Users, 
  Music2, 
  Sparkles, 
  ArrowRight, 
  X,
  FileText,
  Upload,
  Disc3
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ProjectsOnboardingProps {
  onDismiss: () => void;
  onCreateProject?: () => void;
  onCreateArtist?: () => void;
}

const features = [
  {
    icon: Users,
    title: 'AI Артисты',
    description: 'Создайте виртуального артиста с уникальным стилем и голосом',
    color: 'from-purple-500/20 to-pink-500/10',
    iconColor: 'text-purple-500'
  },
  {
    icon: FolderOpen,
    title: 'Проекты',
    description: 'Организуйте треки в альбомы и EP для публикации',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-500'
  },
  {
    icon: FileText,
    title: 'Тексты',
    description: 'Сохраняйте шаблоны текстов для быстрой генерации',
    color: 'from-green-500/20 to-emerald-500/10',
    iconColor: 'text-green-500'
  },
  {
    icon: Upload,
    title: 'Облако',
    description: 'Загружайте референсы для создания каверов и ремиксов',
    color: 'from-orange-500/20 to-amber-500/10',
    iconColor: 'text-orange-500'
  }
];

export function ProjectsOnboarding({ onDismiss, onCreateProject, onCreateArtist }: ProjectsOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-destructive/10 z-10"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Добро пожаловать в Контент-хаб!</h3>
              <p className="text-xs text-muted-foreground">Управляйте артистами, проектами и текстами</p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-xl bg-gradient-to-br border border-border/30",
                  feature.color
                )}
              >
                <feature.icon className={cn("w-5 h-5 mb-1.5", feature.iconColor)} />
                <h4 className="text-xs font-medium mb-0.5">{feature.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={onCreateProject}
            >
              <Disc3 className="w-3.5 h-3.5" />
              Создать проект
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={onCreateArtist}
            >
              <Users className="w-3.5 h-3.5" />
              Создать артиста
            </Button>
          </div>

          {/* Dismiss hint */}
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Нажмите × чтобы скрыть это сообщение
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
