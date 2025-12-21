import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ChevronRight, X } from 'lucide-react';
import { MOODS, badgeVariants, buttonVariants, type MoodOption } from '@/lib/lyrics/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MoodPickerProps {
  value: string[];
  onChange: (moods: string[]) => void;
  mode?: 'multi' | 'single' | 'select';
  maxSelections?: number;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function MoodPicker({ 
  value, 
  onChange, 
  mode = 'multi',
  maxSelections = 3,
  showConfirmButton = true,
  onConfirm,
  className,
  disabled = false,
  placeholder = 'Выберите настроение'
}: MoodPickerProps) {
  const toggleMood = (moodValue: string) => {
    if (mode === 'single') {
      onChange([moodValue]);
      return;
    }
    
    if (value.includes(moodValue)) {
      onChange(value.filter(m => m !== moodValue));
    } else if (value.length < maxSelections) {
      onChange([...value, moodValue]);
    } else {
      toast.info(`Максимум ${maxSelections} настроения`);
    }
  };

  if (mode === 'select') {
    return (
      <Select 
        value={value[0] || ''} 
        onValueChange={(v) => onChange([v])} 
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MOODS.map((mood) => (
            <SelectItem key={mood.value} value={mood.value}>
              <span className="flex items-center gap-2">
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <motion.div 
      className={cn("space-y-3", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m, index) => (
          <motion.div
            key={m.value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <motion.button
              variants={badgeVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              animate={value.includes(m.value) ? "selected" : "idle"}
              type="button"
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                value.includes(m.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 hover:bg-secondary text-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => toggleMood(m.value)}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
              {value.includes(m.value) && (
                <X className="h-3 w-3 ml-0.5" />
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
      
      <AnimatePresence>
        {showConfirmButton && value.length > 0 && onConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              onClick={onConfirm}
            >
              Продолжить
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'multi' && maxSelections > 1 && (
        <p className="text-xs text-muted-foreground">
          Выбрано: {value.length}/{maxSelections}
        </p>
      )}
    </motion.div>
  );
}

// Simple badge-based picker for wizard/forms
interface MoodBadgePickerProps {
  value: string[];
  onChange: (moods: string[]) => void;
  maxSelections?: number;
  className?: string;
}

export function MoodBadgePicker({ 
  value, 
  onChange, 
  maxSelections = 3,
  className 
}: MoodBadgePickerProps) {
  const toggleMood = (moodValue: string) => {
    if (value.includes(moodValue)) {
      onChange(value.filter(m => m !== moodValue));
    } else if (value.length < maxSelections) {
      onChange([...value, moodValue]);
    } else {
      toast.info(`Максимум ${maxSelections} настроения`);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {MOODS.map((mood) => (
        <Badge
          key={mood.value}
          variant={value.includes(mood.value) ? 'default' : 'outline'}
          className="cursor-pointer transition-colors"
          onClick={() => toggleMood(mood.value)}
        >
          {mood.label}
          {value.includes(mood.value) && (
            <X className="h-3 w-3 ml-1" />
          )}
        </Badge>
      ))}
    </div>
  );
}
