import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Mic2, Sparkles, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { cn } from '@/lib/utils';

interface SectionQuickActionsProps {
  sections: DetectedSection[];
  maxDuration: number;
  onSelectSection: (section: DetectedSection, index: number) => void;
}

const SECTION_ICONS: Record<string, typeof Music2> = {
  chorus: Sparkles,
  verse: Mic2,
  bridge: Radio,
  default: Music2,
};

const SECTION_LABELS: Record<string, string> = {
  chorus: 'Припев',
  verse: 'Куплет',
  bridge: 'Бридж',
  intro: 'Интро',
  outro: 'Аутро',
};

export function SectionQuickActions({
  sections,
  maxDuration,
  onSelectSection,
}: SectionQuickActionsProps) {
  // Group sections by type
  const sectionsByType = useMemo(() => {
    const groups: Record<string, { section: DetectedSection; index: number; isTooLong: boolean }[]> = {};
    
    sections.forEach((section, index) => {
      const duration = section.endTime - section.startTime;
      const isTooLong = duration > maxDuration;
      
      if (!groups[section.type]) {
        groups[section.type] = [];
      }
      groups[section.type].push({ section, index, isTooLong });
    });
    
    return groups;
  }, [sections, maxDuration]);

  // Priority order for quick actions
  const priorityTypes = ['chorus', 'verse', 'bridge'];
  const availableTypes = priorityTypes.filter(type => sectionsByType[type]?.length > 0);

  if (availableTypes.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Быстрый выбор:</span>
      {availableTypes.map(type => {
        const items = sectionsByType[type];
        const Icon = SECTION_ICONS[type] || SECTION_ICONS.default;
        const label = SECTION_LABELS[type] || type;
        
        // If there's only one section of this type, show single button
        if (items.length === 1) {
          const { section, index, isTooLong } = items[0];
          return (
            <motion.div key={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 text-xs gap-1.5',
                  isTooLong && 'opacity-70'
                )}
                onClick={() => onSelectSection(section, index)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {isTooLong && <span className="text-amber-500">⚠</span>}
              </Button>
            </motion.div>
          );
        }

        // Multiple sections - show with count
        return (
          <div key={type} className="flex items-center gap-1">
            {items.slice(0, 3).map(({ section, index, isTooLong }, i) => (
              <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 text-xs gap-1',
                    isTooLong && 'opacity-70'
                  )}
                  onClick={() => onSelectSection(section, index)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label} {i + 1}
                </Button>
              </motion.div>
            ))}
            {items.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{items.length - 3}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
