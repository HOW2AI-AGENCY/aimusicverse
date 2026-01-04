import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { UserPlus, ListMusic, Heart, Share2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

export type BannerType = 'follow_creators' | 'add_to_playlist' | 'like_tracks' | 'share_music' | 'create_first';

interface EngagementBannerProps {
  type: BannerType;
  className?: string;
  onAction?: () => void;
}

const bannerConfigs = {
  follow_creators: {
    icon: UserPlus,
    title: 'Подпишитесь на авторов',
    description: 'Следите за творчеством любимых музыкантов и получайте их треки в ленте',
    actionLabel: 'Найти авторов',
    gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/5',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    path: '/community',
  },
  add_to_playlist: {
    icon: ListMusic,
    title: 'Создайте плейлист',
    description: 'Собирайте любимые треки в коллекции и слушайте без перерыва',
    actionLabel: 'Мои плейлисты',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/5',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    path: '/playlists',
  },
  like_tracks: {
    icon: Heart,
    title: 'Ставьте лайки',
    description: 'Отмечайте понравившиеся треки и находите их в разделе избранного',
    actionLabel: 'Избранное',
    gradient: 'from-rose-500/20 via-pink-500/10 to-red-500/5',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    path: '/library?tab=liked',
  },
  share_music: {
    icon: Share2,
    title: 'Делитесь музыкой',
    description: 'Отправляйте треки друзьям и в социальные сети',
    actionLabel: 'Узнать больше',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-sky-500/5',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    path: '/library',
  },
  create_first: {
    icon: Sparkles,
    title: 'Создайте свой первый трек',
    description: 'AI сгенерирует музыку по вашему описанию за несколько секунд',
    actionLabel: 'Создать',
    gradient: 'from-primary/20 via-generate/10 to-primary/5',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    path: '/?generate=true',
  },
};

export const EngagementBanner = memo(function EngagementBanner({
  type,
  className,
  onAction,
}: EngagementBannerProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const config = bannerConfigs[type];
  const Icon = config.icon;

  const handleAction = () => {
    hapticFeedback?.('light');
    if (onAction) {
      onAction();
    } else {
      navigate(config.path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        `bg-gradient-to-r ${config.gradient}`,
        "border border-border/30",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <motion.div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            config.iconBg
          )}
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <Icon className={cn("w-6 h-6", config.iconColor)} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-0.5">{config.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{config.description}</p>
        </div>

        {/* Action */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAction}
          className="shrink-0 h-8 px-3 text-xs gap-1 rounded-lg"
        >
          {config.actionLabel}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
});
