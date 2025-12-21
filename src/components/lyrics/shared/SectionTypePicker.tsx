import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTION_TYPES, type SectionType } from '@/lib/lyrics/constants';
import { Badge } from '@/components/ui/badge';

interface SectionTypePickerProps {
  onSelect: (type: string, name: string, defaultLines: number) => void;
  className?: string;
  showAddIcon?: boolean;
  variant?: 'badge' | 'button';
}

export function SectionTypePicker({ 
  onSelect, 
  className,
  showAddIcon = true,
  variant = 'badge'
}: SectionTypePickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {SECTION_TYPES.map((section) => (
        variant === 'badge' ? (
          <Badge
            key={section.type}
            variant="outline"
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelect(section.type, section.name, section.defaultLines)}
          >
            <span className="mr-1">{section.icon}</span>
            {section.name}
            {showAddIcon && <Plus className="h-3 w-3 ml-1" />}
          </Badge>
        ) : (
          <button
            key={section.type}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors"
            onClick={() => onSelect(section.type, section.name, section.defaultLines)}
          >
            <span>{section.icon}</span>
            <span>{section.name}</span>
            {showAddIcon && <Plus className="h-3 w-3" />}
          </button>
        )
      ))}
    </div>
  );
}

// Helper to get section info
export function getSectionInfo(type: string): SectionType | undefined {
  return SECTION_TYPES.find(s => s.type === type);
}
