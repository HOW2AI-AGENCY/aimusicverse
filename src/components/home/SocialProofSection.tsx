/**
 * SocialProofSection - Секция со статистикой платформы
 * Показывает: количество треков, пользователей, жанров
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Users, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofSectionProps {
  tracksCount?: number;
  usersCount?: number;
  likesCount?: number;
  className?: string;
}

const STATS = [
  { 
    icon: Music2, 
    label: 'треков создано',
    getValue: (props: SocialProofSectionProps) => props.tracksCount || 10000,
    color: 'text-primary',
    bgColor: 'from-primary/20 to-primary/5'
  },
  { 
    icon: Users, 
    label: 'создателей',
    getValue: (props: SocialProofSectionProps) => props.usersCount || 5000,
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 to-emerald-500/5'
  },
  { 
    icon: Heart, 
    label: 'лайков',
    getValue: (props: SocialProofSectionProps) => props.likesCount || 25000,
    color: 'text-rose-400',
    bgColor: 'from-rose-500/20 to-rose-500/5'
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return num.toString();
}

export const SocialProofSection = memo(function SocialProofSection(props: SocialProofSectionProps) {
  return (
    <section className={cn("py-4", props.className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-1 mb-4"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">Присоединяйся к сообществу</span>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className={cn(
              "relative overflow-hidden rounded-2xl p-4",
              "bg-gradient-to-br border border-border/50",
              stat.bgColor
            )}
          >
            <div className="relative z-10 text-center">
              <motion.div
                className={cn(
                  "w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center",
                  "bg-background/50 backdrop-blur-sm"
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </motion.div>
              <motion.p 
                className="text-xl font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
              >
                {formatNumber(stat.getValue(props))}+
              </motion.p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
});
