/**
 * AnalyzeButton - Unified button to trigger audio analysis
 * Supports different analysis types and shows progress
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sparkles, ChevronDown, Music, Gauge, Heart, 
  FileMusic, AudioWaveform, Loader2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedAnalysis } from '@/hooks/useUnifiedAnalysis';
import type { AnalysisType } from '@/services/unified-analysis/types';

interface AnalyzeButtonProps extends Omit<ButtonProps, 'onClick'> {
  trackId?: string;
  audioUrl?: string;
  userId?: string;
  onAnalysisComplete?: (result: unknown) => void;
  showDropdown?: boolean;
  defaultType?: AnalysisType;
}

const analysisOptions: { type: AnalysisType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'full', 
    label: 'Полный анализ', 
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Стиль, теория, эмоции'
  },
  { 
    type: 'style', 
    label: 'Стиль', 
    icon: <Music className="w-4 h-4" />,
    description: 'Жанр, настроение, инструменты'
  },
  { 
    type: 'music-theory', 
    label: 'Теория', 
    icon: <Gauge className="w-4 h-4" />,
    description: 'BPM, тональность, размер'
  },
  { 
    type: 'emotion', 
    label: 'Эмоции', 
    icon: <Heart className="w-4 h-4" />,
    description: 'Энергия, позитив'
  },
  { 
    type: 'chords', 
    label: 'Аккорды', 
    icon: <Music className="w-4 h-4" />,
    description: 'Распознавание аккордов'
  },
  { 
    type: 'beats', 
    label: 'Ритм', 
    icon: <AudioWaveform className="w-4 h-4" />,
    description: 'Определение битов'
  },
  { 
    type: 'transcription', 
    label: 'Транскрипция', 
    icon: <FileMusic className="w-4 h-4" />,
    description: 'MIDI транскрипция'
  },
];

export const AnalyzeButton = memo(function AnalyzeButton({
  trackId,
  audioUrl,
  userId,
  onAnalysisComplete,
  showDropdown = true,
  defaultType = 'full',
  className,
  children,
  ...props
}: AnalyzeButtonProps) {
  const { analyze, isAnalyzing, status, currentStep } = useUnifiedAnalysis();
  const [lastAnalyzedType, setLastAnalyzedType] = useState<AnalysisType | null>(null);

  const handleAnalyze = async (type: AnalysisType) => {
    if (!audioUrl && !trackId) return;

    setLastAnalyzedType(type);
    
    try {
      const result = await analyze({
        trackId,
        audioUrl,
        userId,
        analysisTypes: [type],
      });
      
      onAnalysisComplete?.(result);
    } catch (error) {
      // Error handled by hook
    }
  };

  const buttonContent = (
    <>
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs truncate max-w-[100px]">
              {currentStep || 'Анализ...'}
            </span>
          </motion.div>
        ) : status === 'completed' && lastAnalyzedType ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-green-500" />
            <span>Готово</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {children || <span>Анализ</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (!showDropdown) {
    return (
      <Button
        onClick={() => handleAnalyze(defaultType)}
        disabled={isAnalyzing || (!audioUrl && !trackId)}
        className={cn("gap-2", className)}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isAnalyzing || (!audioUrl && !trackId)}
          className={cn("gap-2", className)}
          {...props}
        >
          {buttonContent}
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {analysisOptions.slice(0, 4).map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleAnalyze(option.type)}
            className="gap-3 py-2"
          >
            <div className="text-primary">{option.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <p className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Специализированный
        </p>
        
        {analysisOptions.slice(4).map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleAnalyze(option.type)}
            className="gap-3 py-2"
          >
            <div className="text-muted-foreground">{option.icon}</div>
            <div className="flex-1">
              <p className="text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default AnalyzeButton;
