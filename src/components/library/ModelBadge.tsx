import { Crown, Sparkles, LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SUNO_MODELS } from '@/constants/sunoModels';

interface ModelDisplayInfo {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  desc: string;
}

const MODEL_DISPLAY: Record<string, ModelDisplayInfo> = {
  // API model names
  'chirp-crow': { 
    icon: Crown, 
    label: 'V5',
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-400/15',
    desc: 'Новейшая модель'
  },
  'chirp-bluejay': { 
    icon: Crown, 
    label: 'V4.5+',
    color: 'text-amber-400', 
    bgColor: 'bg-amber-400/12',
    desc: 'Богатый звук'
  },
  'chirp-auk': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-amber-500/80', 
    bgColor: 'bg-amber-500/10',
    desc: 'Лучшая структура'
  },
  'chirp-v4': { 
    icon: Sparkles, 
    label: 'V4',
    color: 'text-zinc-400', 
    bgColor: 'bg-zinc-400/10',
    desc: 'Классика'
  },
  // UI keys from suno_model field
  'V5': { 
    icon: Crown, 
    label: 'V5',
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-400/15',
    desc: 'Новейшая модель'
  },
  'V4_5PLUS': { 
    icon: Crown, 
    label: 'V4.5+',
    color: 'text-amber-400', 
    bgColor: 'bg-amber-400/12',
    desc: 'Богатый звук'
  },
  'V4_5ALL': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-amber-500/80', 
    bgColor: 'bg-amber-500/10',
    desc: 'Лучшая структура'
  },
  'V4_5': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-amber-500/80', 
    bgColor: 'bg-amber-500/10',
    desc: 'Лучшая структура'
  },
  'V4AUK': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-amber-500/80', 
    bgColor: 'bg-amber-500/10',
    desc: 'Лучшая структура'
  },
  'V4': { 
    icon: Sparkles, 
    label: 'V4',
    color: 'text-zinc-400', 
    bgColor: 'bg-zinc-400/10',
    desc: 'Классика'
  },
};

// Get model info from track's suno_model or model_name
export function getModelDisplayInfo(model: string | null | undefined): ModelDisplayInfo | null {
  if (!model) return null;
  
  // Direct match with API model name
  if (MODEL_DISPLAY[model]) {
    return MODEL_DISPLAY[model];
  }
  
  // Try to match via SUNO_MODELS constant
  for (const [, info] of Object.entries(SUNO_MODELS)) {
    if (model === info.apiModel || model.toLowerCase().includes(info.name.toLowerCase().replace('.', ''))) {
      const display = MODEL_DISPLAY[info.apiModel];
      if (display) return display;
    }
  }
  
  // Fallback pattern matching for legacy data
  // Normalize: lowercase, remove underscores, replace _ with nothing
  const modelNormalized = model.toLowerCase().replace(/_/g, '');
  
  if (modelNormalized.includes('v5') || modelNormalized.includes('crow')) {
    return MODEL_DISPLAY['V5'];
  }
  if (modelNormalized.includes('45plus') || modelNormalized.includes('bluejay')) {
    return MODEL_DISPLAY['V4_5PLUS'];
  }
  if (modelNormalized.includes('45') || modelNormalized.includes('auk')) {
    return MODEL_DISPLAY['V4_5'];
  }
  if (modelNormalized.includes('v4') || modelNormalized.includes('chirpv4')) {
    return MODEL_DISPLAY['V4'];
  }
  
  return null;
}

interface ModelBadgeProps {
  model: string | null | undefined;
  compact?: boolean;
  className?: string;
}

export function ModelBadge({ model, compact = false, className }: ModelBadgeProps) {
  const info = getModelDisplayInfo(model);
  
  if (!info) return null;
  
  const Icon = info.icon;
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-0.5 rounded cursor-help flex-shrink-0",
              info.bgColor,
              compact ? "px-1 py-0.5" : "px-1.5 py-0.5",
              className
            )}
          >
            <Icon className={cn("w-2.5 h-2.5", info.color)} />
            <span className={cn(
              "font-semibold",
              info.color,
              compact ? "text-[9px]" : "text-[10px]"
            )}>
              {info.label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Модель: {info.label} — {info.desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
