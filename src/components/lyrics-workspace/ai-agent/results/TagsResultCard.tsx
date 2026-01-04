/**
 * TagsResultCard - Display generated tags with apply action
 */

import { motion } from '@/lib/motion';
import { Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hapticImpact } from '@/lib/haptic';

interface TagsResultCardProps {
  tags: string[];
  onApply?: (tags: string[]) => void;
  onApplySingle?: (tag: string) => void;
}

export function TagsResultCard({ tags, onApply, onApplySingle }: TagsResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => { onApplySingle?.(tag); hapticImpact('light'); }}
          >
            [{tag}]
            {onApplySingle && <Plus className="w-2.5 h-2.5 ml-1" />}
          </Badge>
        ))}
      </div>
      {onApply && (
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => { onApply(tags); hapticImpact('medium'); }}
        >
          <Tag className="w-3 h-3" />
          Добавить все ({tags.length})
        </Button>
      )}
    </motion.div>
  );
}
