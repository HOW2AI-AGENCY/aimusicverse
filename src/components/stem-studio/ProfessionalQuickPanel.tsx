import { motion } from '@/lib/motion';
import { 
  FileMusic, Music2, FileText, Download, 
  Scissors, Wand2, Sparkles, Piano, Guitar,
  Activity, Sliders, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/track';
import { TrackStem } from '@/hooks/useTrackStems';

interface ProfessionalQuickPanelProps {
  track: Track;
  stems: TrackStem[];
  onOpenMidi: () => void;
  onOpenEffects: () => void;
  onOpenExport: () => void;
  onOpenAnalysis: () => void;
  hasMidi?: boolean;
  midiCount?: number;
  stemCount?: number;
}

const quickActions = [
  {
    id: 'midi',
    label: 'MIDI & Piano',
    description: 'Транскрипция в MIDI',
    icon: Piano,
    color: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  {
    id: 'effects',
    label: 'Effects',
    description: 'EQ, Compressor, Reverb',
    icon: Sliders,
    color: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'WAV, MP3, MIDI, Stems',
    icon: Download,
    color: 'from-blue-500 to-cyan-500',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'analysis',
    label: 'AI Analysis',
    description: 'BPM, Key, Structure',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
];

export function ProfessionalQuickPanel({
  track,
  stems,
  onOpenMidi,
  onOpenEffects,
  onOpenExport,
  onOpenAnalysis,
  hasMidi,
  midiCount = 0,
  stemCount = 0,
}: ProfessionalQuickPanelProps) {
  
  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'midi':
        onOpenMidi();
        break;
      case 'effects':
        onOpenEffects();
        break;
      case 'export':
        onOpenExport();
        break;
      case 'analysis':
        onOpenAnalysis();
        break;
    }
  };

  const getActionBadge = (actionId: string) => {
    switch (actionId) {
      case 'midi':
        return midiCount > 0 ? midiCount.toString() : null;
      case 'effects':
        return null;
      case 'export':
        return stemCount > 0 ? stemCount.toString() : null;
      case 'analysis':
        return null; // Audio analysis check removed - property not on Track type
      default:
        return null;
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Professional Tools</h3>
              <p className="text-xs text-muted-foreground">Quick access to advanced features</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            PRO
          </Badge>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const badge = getActionBadge(action.id);
            
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "relative h-auto flex flex-col items-center gap-2 p-3 transition-all",
                    "hover:shadow-md touch-manipulation",
                    action.bgColor,
                    action.borderColor
                  )}
                  onClick={() => handleAction(action.id)}
                >
                  {/* Badge */}
                  {badge && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-bold"
                    >
                      {badge}
                    </Badge>
                  )}

                  {/* Icon */}
                  <motion.div
                    className={cn(
                      "p-2 rounded-lg",
                      `bg-gradient-to-br ${action.color}`
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </motion.div>

                  {/* Label */}
                  <div className="text-center">
                    <div className="font-medium text-xs">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
          <Sparkles className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Все профессиональные инструменты для работы с треком
          </p>
        </div>
      </div>
    </Card>
  );
}
