import { cn } from '@/lib/utils';
import { Zap, Sun, Moon, Cloud } from 'lucide-react';

interface EmotionBadgeProps {
  arousal: number;
  valence: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface EmotionInfo {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function getEmotionInfo(arousal: number, valence: number, size: 'sm' | 'md' | 'lg'): EmotionInfo {
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  
  if (arousal >= 0.5 && valence >= 0.5) {
    return {
      label: 'Радостный',
      icon: <Zap className={iconSize} />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
    };
  }
  if (arousal >= 0.5 && valence < 0.5) {
    return {
      label: 'Напряжённый',
      icon: <Sun className={iconSize} />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    };
  }
  if (arousal < 0.5 && valence >= 0.5) {
    return {
      label: 'Спокойный',
      icon: <Moon className={iconSize} />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
    };
  }
  return {
    label: 'Грустный',
    icon: <Cloud className={iconSize} />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
  };
}

export function EmotionBadge({ 
  arousal, 
  valence, 
  className,
  showLabel = true,
  size = 'sm'
}: EmotionBadgeProps) {
  const emotion = getEmotionInfo(arousal, valence, size);
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        emotion.bgColor,
        emotion.color,
        sizeClasses[size],
        className
      )}
    >
      {emotion.icon}
      {showLabel && <span>{emotion.label}</span>}
    </span>
  );
}

export function EmotionIndicator({ 
  arousal, 
  valence 
}: { 
  arousal: number; 
  valence: number 
}) {
  const emotion = getEmotionInfo(arousal, valence, 'sm');
  
  return (
    <div 
      className={cn(
        'w-2 h-2 rounded-full',
        emotion.color.replace('text-', 'bg-')
      )}
      title={emotion.label}
    />
  );
}
