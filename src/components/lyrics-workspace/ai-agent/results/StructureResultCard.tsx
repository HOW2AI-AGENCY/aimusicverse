/**
 * StructureResultCard - Display song structure analysis beautifully
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music, Sparkles, Tag, Volume2, Guitar, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StructureSection {
  tag: string;
  description?: string;
  recommendedTags?: string[];
}

interface StructureResultCardProps {
  content: string;
  className?: string;
}

// Parse structure analysis text into sections
function parseStructureContent(content: string): StructureSection[] {
  const sections: StructureSection[] = [];
  const lines = content.split('\n');
  
  let currentSection: StructureSection | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for section tag like [Verse 1], [Chorus], etc.
    const tagMatch = trimmedLine.match(/^\[([^\]]+)\]/);
    if (tagMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        tag: tagMatch[1],
        description: '',
        recommendedTags: [],
      };
      continue;
    }
    
    if (currentSection) {
      // Check for description
      if (trimmedLine.toLowerCase().startsWith('описание:')) {
        currentSection.description = trimmedLine.replace(/^описание:\s*/i, '');
      }
      // Check for recommended tags
      else if (trimmedLine.toLowerCase().includes('рекомендуемые теги:') || 
               trimmedLine.toLowerCase().includes('теги:')) {
        const tagsStr = trimmedLine.replace(/^.*теги:\s*/i, '');
        const tags = tagsStr.match(/\[([^\]]+)\]|\(([^)]+)\)/g) || [];
        currentSection.recommendedTags = tags.map(t => t.replace(/[\[\]\(\)]/g, ''));
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Get icon for section type
function getSectionIcon(tag: string) {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes('verse') || lowerTag.includes('куплет')) {
    return <Music className="w-3.5 h-3.5" />;
  }
  if (lowerTag.includes('chorus') || lowerTag.includes('припев')) {
    return <Sparkles className="w-3.5 h-3.5" />;
  }
  if (lowerTag.includes('bridge') || lowerTag.includes('бридж')) {
    return <Zap className="w-3.5 h-3.5" />;
  }
  if (lowerTag.includes('intro')) {
    return <Volume2 className="w-3.5 h-3.5" />;
  }
  if (lowerTag.includes('outro')) {
    return <Guitar className="w-3.5 h-3.5" />;
  }
  return <Tag className="w-3.5 h-3.5" />;
}

// Get color for section type
function getSectionColor(tag: string) {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes('verse') || lowerTag.includes('куплет')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (lowerTag.includes('chorus') || lowerTag.includes('припев')) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  if (lowerTag.includes('bridge') || lowerTag.includes('бридж')) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
  if (lowerTag.includes('pre-chorus') || lowerTag.includes('пре-припев')) {
    return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  }
  if (lowerTag.includes('hook') || lowerTag.includes('хук')) {
    return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
  }
  if (lowerTag.includes('intro')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (lowerTag.includes('outro')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  if (lowerTag.includes('drop') || lowerTag.includes('breakdown')) {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }
  return 'bg-muted text-muted-foreground border-border/50';
}

export function StructureResultCard({ content, className }: StructureResultCardProps) {
  const sections = parseStructureContent(content);
  
  // If we couldn't parse sections, just show the raw content nicely formatted
  if (sections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mt-2 p-3 bg-background/80 rounded-xl border border-border/50",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <h4 className="text-sm font-medium">Анализ структуры</h4>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
          {content}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-medium">Структура песни</h4>
          <p className="text-[10px] text-muted-foreground">{sections.length} секций</p>
        </div>
      </div>
      
      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "p-2 rounded-lg border",
              getSectionColor(section.tag)
            )}
          >
            <div className="flex items-center gap-2">
              {getSectionIcon(section.tag)}
              <span className="text-xs font-medium">[{section.tag}]</span>
            </div>
            
            {section.description && (
              <p className="text-[11px] mt-1 opacity-80">{section.description}</p>
            )}
            
            {section.recommendedTags && section.recommendedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {section.recommendedTags.map((tag, tagIdx) => (
                  <Badge
                    key={tagIdx}
                    variant="outline"
                    className="text-[9px] h-4 px-1.5 bg-background/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
