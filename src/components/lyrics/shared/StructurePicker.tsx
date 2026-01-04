import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { STRUCTURES, buttonVariants, type StructureOption } from '@/lib/lyrics/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StructurePickerProps {
  value: string;
  onChange: (structure: string) => void;
  mode?: 'cards' | 'select';
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function StructurePicker({ 
  value, 
  onChange, 
  mode = 'cards',
  className,
  disabled = false,
  placeholder = 'Выберите структуру'
}: StructurePickerProps) {
  if (mode === 'select') {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {STRUCTURES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Cards mode (default)
  return (
    <motion.div 
      className={cn("space-y-2", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {STRUCTURES.map((s, index) => (
        <motion.div
          key={s.value}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex flex-col items-start text-left px-4 py-3 rounded-xl transition-all",
              value === s.value
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/50 hover:bg-secondary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => onChange(s.value)}
          >
            <span className="font-medium text-sm">{s.label}</span>
            <span className={cn(
              "text-xs mt-0.5",
              value === s.value ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {s.desc}
            </span>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}
