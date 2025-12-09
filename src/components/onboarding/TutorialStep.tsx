import { motion } from 'framer-motion';
import { Check, Play, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import tutorial images
import generateScreen from '@/assets/onboarding/generate-screen.png';
import libraryScreen from '@/assets/onboarding/library-screen.png';
import stemStudioScreen from '@/assets/onboarding/stem-studio-screen.png';
import projectsScreen from '@/assets/onboarding/projects-screen.png';

export const TUTORIAL_IMAGES: Record<string, string> = {
  'generate': generateScreen,
  'library': libraryScreen,
  'stem-studio': stemStudioScreen,
  'projects': projectsScreen,
};

interface TutorialStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    icon: any;
    features?: string[];
    tip?: string;
    route?: string;
    imageId?: string;
    videoUrl?: string;
  };
  stepNumber: number;
  totalSteps: number;
  onTryNow?: () => void;
}

export function TutorialStep({ step, stepNumber, totalSteps, onTryNow }: TutorialStepProps) {
  const StepIcon = step.icon;
  const tutorialImage = step.imageId ? TUTORIAL_IMAGES[step.imageId] : null;

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Image preview */}
      {tutorialImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 rounded-xl overflow-hidden border border-border/50 shadow-lg"
        >
          <div className="relative aspect-[16/10] bg-card">
            <img
              src={tutorialImage}
              alt={step.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            
            {/* Step indicator on image */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant="secondary" 
                className="bg-background/90 backdrop-blur-sm border-border/50"
              >
                <StepIcon className="w-3 h-3 mr-1" />
                {step.title}
              </Badge>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-5 rounded-xl bg-card border border-border/50"
      >
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0"
          >
            <StepIcon className="w-6 h-6 text-primary" />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-medium">
                Шаг {stepNumber} из {totalSteps}
              </span>
            </div>
            <h3 className="text-lg font-bold">{step.title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Features list */}
        {step.features && step.features.length > 0 && (
          <ul className="space-y-2 mb-4">
            {step.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-2 text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </motion.li>
            ))}
          </ul>
        )}

        {/* Tip */}
        {step.tip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
          >
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary/80">
              <span className="font-medium">Совет:</span> {step.tip}
            </p>
          </motion.div>
        )}

        {/* Try now button */}
        {step.route && onTryNow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onTryNow}
              className="w-full rounded-xl gap-2 border-primary/30 hover:bg-primary/10"
            >
              <Play className="w-3.5 h-3.5" />
              Попробовать сейчас
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
