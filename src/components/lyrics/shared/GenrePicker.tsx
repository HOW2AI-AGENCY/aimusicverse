import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { GENRES, buttonVariants, type GenreOption } from '@/lib/lyrics/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GenrePickerProps {
  value: string;
  onChange: (genre: string) => void;
  mode?: 'grid' | 'select' | 'compact';
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function GenrePicker({ 
  value, 
  onChange, 
  mode = 'grid',
  className,
  disabled = false,
  placeholder = 'Выберите жанр'
}: GenrePickerProps) {
  if (mode === 'select') {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {GENRES.map((genre) => (
            <SelectItem key={genre.value} value={genre.value}>
              <span className="flex items-center gap-2">
                <span>{genre.emoji}</span>
                <span>{genre.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (mode === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {GENRES.slice(0, 8).map((g) => (
          <motion.button
            key={g.value}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
              value === g.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 hover:bg-secondary text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => onChange(g.value)}
          >
            <span>{g.emoji}</span>
            <span>{g.label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  // Grid mode (default)
  return (
    <motion.div 
      className={cn("grid grid-cols-3 gap-1.5", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {GENRES.map((g, index) => (
        <motion.div
          key={g.value}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all",
              value === g.value
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/50 hover:bg-secondary text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => onChange(g.value)}
          >
            <span className="text-sm">{g.emoji}</span>
            <span className="truncate">{g.label}</span>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}
