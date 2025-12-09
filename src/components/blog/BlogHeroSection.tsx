import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogHeroSectionProps {
  isAdmin?: boolean;
  onCreateNew?: () => void;
}

export const BlogHeroSection = memo(function BlogHeroSection({
  isAdmin,
  onCreateNew,
}: BlogHeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 sm:p-8 mb-8"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="p-4 rounded-2xl bg-primary/10 border border-primary/20"
          >
            <BookOpen className="w-8 h-8 text-primary" />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text"
            >
              Блог
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mt-1"
            >
              Новости, гайды и обновления платформы
            </motion.p>
          </div>
        </div>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button onClick={onCreateNew} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Новая статья
            </Button>
          </motion.div>
        )}
      </div>

      {/* Stats or quick links could go here */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative mt-6 flex flex-wrap gap-3"
      >
        {['Гайды', 'Обновления', 'Советы', 'Новости'].map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="px-3 py-1.5 text-sm rounded-full bg-muted/50 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer"
          >
            {tag}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
});
