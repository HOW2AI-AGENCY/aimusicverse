import { Rocket, Gem, Target, Sparkles, LucideIcon } from 'lucide-react';
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
  'chirp-crow': { 
    icon: Rocket, 
    label: 'V5',
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500/10',
    desc: 'Новейшая модель'
  },
  'chirp-bluejay': { 
    icon: Gem, 
    label: 'V4.5+',
    color: 'text-violet-500', 
    bgColor: 'bg-violet-500/10',
    desc: 'Богатый звук'
  },
  'chirp-auk': { 
    icon: Target, 
    label: 'V4.5',
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10',
    desc: 'Лучшая структура'
  },
  'chirp-v4': { 
    icon: Sparkles, 
    label: 'V4',
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/10',
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
  const modelLower = model.toLowerCase();
  if (modelLower.includes('v5') || modelLower.includes('crow')) {
    return MODEL_DISPLAY['chirp-crow'];
  }
  if (modelLower.includes('4.5+') || modelLower.includes('bluejay')) {
    return MODEL_DISPLAY['chirp-bluejay'];
  }
  if (modelLower.includes('4.5') || modelLower.includes('auk')) {
    return MODEL_DISPLAY['chirp-auk'];
  }
  if (modelLower.includes('v4') || modelLower.includes('chirp-v4')) {
    return MODEL_DISPLAY['chirp-v4'];
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
