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
  // API model names - V5 (Gold/Crown)
  'chirp-crow': { 
    icon: Crown, 
    label: 'V5',
    color: 'text-yellow-300', 
    bgColor: 'bg-yellow-500/20',
    desc: 'Новейшая модель'
  },
  // V4.5+ (Emerald/Green)
  'chirp-bluejay': { 
    icon: Crown, 
    label: 'V4.5+',
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/15',
    desc: 'Богатый звук'
  },
  // V4.5 (Cyan/Teal)
  'chirp-auk': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/15',
    desc: 'Лучшая структура'
  },
  // V4 (Purple/Violet)
  'chirp-v4': { 
    icon: Sparkles, 
    label: 'V4',
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/15',
    desc: 'Классика'
  },
  // UI keys from suno_model field - V5
  'V5': { 
    icon: Crown, 
    label: 'V5',
    color: 'text-yellow-300', 
    bgColor: 'bg-yellow-500/20',
    desc: 'Новейшая модель'
  },
  // V4.5+
  'V4_5PLUS': { 
    icon: Crown, 
    label: 'V4.5+',
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/15',
    desc: 'Богатый звук'
  },
  // V4.5
  'V4_5ALL': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/15',
    desc: 'Лучшая структура'
  },
  'V4_5': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/15',
    desc: 'Лучшая структура'
  },
  'V4AUK': { 
    icon: Sparkles, 
    label: 'V4.5',
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/15',
    desc: 'Лучшая структура'
  },
  // V4
  'V4': { 
    icon: Sparkles, 
    label: 'V4',
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/15',
    desc: 'Классика'
  },
  // V3.5 (Rose/Pink)
  'V3_5': { 
    icon: Sparkles, 
    label: 'V3.5',
    color: 'text-rose-400', 
    bgColor: 'bg-rose-500/15',
    desc: 'Ретро'
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
