/**
 * VocalMapResultCard - Display vocal production map for sections
 */

import { motion } from '@/lib/motion';
import { Mic, Music, Volume2, Users, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface VocalSection {
  section: string;
  vocalType?: string;
  effects?: string[];
  backingVocals?: string;
  dynamics?: string;
  emotionalNote?: string;
}

interface VocalMapResultCardProps {
  sections: VocalSection[];
  onCopyAll?: () => void;
}

export function VocalMapResultCard({ sections, onCopyAll }: VocalMapResultCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const formatSectionForCopy = (section: VocalSection) => {
    const parts = [`[${section.section}]`];
    if (section.vocalType) parts.push(`Тип: ${section.vocalType}`);
    if (section.dynamics) parts.push(`Динамика: ${section.dynamics}`);
    if (section.effects?.length) parts.push(`Эффекты: ${section.effects.join(', ')}`);
    if (section.backingVocals) parts.push(`Бэк-вокал: ${section.backingVocals}`);
    if (section.emotionalNote) parts.push(`Эмоция: ${section.emotionalNote}`);
    return parts.join('\n');
  };

  const handleCopySection = async (section: VocalSection, index: number) => {
    try {
      await navigator.clipboard.writeText(formatSectionForCopy(section));
      setCopiedIndex(index);
      hapticImpact('light');
      toast.success('Скопировано!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleCopyAll = async () => {
    try {
      const allText = sections.map(formatSectionForCopy).join('\n\n');
      await navigator.clipboard.writeText(allText);
      hapticImpact('medium');
      toast.success('Вся карта скопирована!');
      onCopyAll?.();
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const getEffectIcon = (effect: string) => {
    const lowerEffect = effect.toLowerCase();
    if (lowerEffect.includes('reverb') || lowerEffect.includes('реверб')) return '🌊';
    if (lowerEffect.includes('delay') || lowerEffect.includes('дилей')) return '⏱️';
    if (lowerEffect.includes('auto') || lowerEffect.includes('tune')) return '🎵';
    if (lowerEffect.includes('whisper') || lowerEffect.includes('шепот')) return '🤫';
    if (lowerEffect.includes('falsetto') || lowerEffect.includes('фальцет')) return '✨';
    if (lowerEffect.includes('distort') || lowerEffect.includes('искаж')) return '⚡';
    return '🎤';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Вокальная карта</h4>
            <p className="text-[10px] text-muted-foreground">
              {sections.length} секций
            </p>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={handleCopyAll}
        >
          <Copy className="w-3 h-3" />
          Копировать всё
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group p-2.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-300">
                {section.section}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCopySection(section, idx)}
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>

            {/* Section Content */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {section.vocalType && (
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Тип:</span>
                  <span className="text-foreground">{section.vocalType}</span>
                </div>
              )}
              
              {section.dynamics && (
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Динамика:</span>
                  <span className="text-foreground">{section.dynamics}</span>
                </div>
              )}
              
              {section.backingVocals && (
                <div className="flex items-center gap-1.5 col-span-2">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Бэк:</span>
                  <span className="text-foreground">{section.backingVocals}</span>
                </div>
              )}
            </div>

            {/* Effects */}
            {section.effects && section.effects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {section.effects.map((effect, effIdx) => (
                  <Badge
                    key={effIdx}
                    variant="secondary"
                    className="text-[9px] py-0 px-1.5 bg-background/50"
                  >
                    {getEffectIcon(effect)} {effect}
                  </Badge>
                ))}
              </div>
            )}

            {/* Emotional Note */}
            {section.emotionalNote && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-400/80 bg-amber-500/10 p-1.5 rounded">
                <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{section.emotionalNote}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
