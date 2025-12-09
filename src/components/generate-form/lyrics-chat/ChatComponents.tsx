import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCcw, Copy, Check, Bookmark, BookmarkCheck, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GENRES, MOODS, STRUCTURES, buttonVariants, badgeVariants } from './constants';

interface GenreSelectorProps {
  selectedGenre: string;
  onSelect: (genre: string) => void;
}

export function GenreSelector({ selectedGenre, onSelect }: GenreSelectorProps) {
  return (
    <motion.div 
      className="grid grid-cols-3 gap-1.5 mt-3"
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
            className={cn(
              "w-full flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all",
              selectedGenre === g.value
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/50 hover:bg-secondary text-foreground"
            )}
            onClick={() => onSelect(g.value)}
          >
            <span className="text-sm">{g.emoji}</span>
            <span className="truncate">{g.label}</span>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}

interface MoodSelectorProps {
  selectedMoods: string[];
  onSelect: (mood: string) => void;
  onConfirm: () => void;
}

export function MoodSelector({ selectedMoods, onSelect, onConfirm }: MoodSelectorProps) {
  return (
    <motion.div 
      className="space-y-3 mt-3"
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
              animate={selectedMoods.includes(m.value) ? "selected" : "idle"}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                selectedMoods.includes(m.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              )}
              onClick={() => onSelect(m.value)}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </motion.button>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selectedMoods.length > 0 && (
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
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              onClick={onConfirm}
            >
              Продолжить
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface StructureSelectorProps {
  selectedStructure: string;
  onSelect: (structure: string) => void;
}

export function StructureSelector({ selectedStructure, onSelect }: StructureSelectorProps) {
  return (
    <motion.div 
      className="space-y-2 mt-3"
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
            className={cn(
              "w-full flex flex-col items-start text-left px-4 py-3 rounded-xl transition-all",
              selectedStructure === s.value
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/50 hover:bg-secondary"
            )}
            onClick={() => onSelect(s.value)}
          >
            <span className="font-medium text-sm">{s.label}</span>
            <span className={cn(
              "text-xs mt-0.5",
              selectedStructure === s.value ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {s.desc}
            </span>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  );
}

interface LyricsPreviewProps {
  lyrics: string;
  copied: boolean;
  saved: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  onApply: () => void;
  onContinue: () => void;
}

export function LyricsPreview({
  lyrics,
  copied,
  saved,
  isSaving,
  isLoading,
  onCopy,
  onSave,
  onRegenerate,
  onApply,
  onContinue,
}: LyricsPreviewProps) {
  return (
    <motion.div 
      className="mt-3 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div 
        className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 max-h-[200px] sm:max-h-[280px] overflow-y-auto shadow-inner"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
          {lyrics}
        </pre>
      </motion.div>
      <div className="flex flex-wrap gap-2">
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Скопировано' : 'Копировать'}
        </motion.button>
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
            saved 
              ? "bg-green-500/20 text-green-600 dark:text-green-400" 
              : "bg-secondary/50 hover:bg-secondary"
          )}
          onClick={onSave}
          disabled={isSaving || saved}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <BookmarkCheck className="h-3.5 w-3.5" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          {saved ? 'Сохранено' : 'В библиотеку'}
        </motion.button>
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          onClick={onRegenerate}
          disabled={isLoading}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Заново
        </motion.button>
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors"
          onClick={onContinue}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Продолжить
        </motion.button>
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg"
          onClick={onApply}
        >
          <Check className="h-3.5 w-3.5" />
          Применить
        </motion.button>
      </div>
      <p className="text-xs text-muted-foreground px-1">
        💡 Напишите, что изменить, или продолжите диалог
      </p>
    </motion.div>
  );
}

interface LoadingIndicatorProps {}

export function LoadingIndicator({}: LoadingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start"
    >
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <motion.div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                animate={{ 
                  y: [0, -4, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
