/**
 * NotFound - Contextual 404 error page in MusicVerse style
 * Provides relevant messaging based on URL path
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { logger } from "@/lib/logger";
import { useTelegram } from "@/contexts/TelegramContext";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Music2, Search, Radio, Disc3, HeadphonesIcon, FolderOpen, ListMusic, User, Mic2 } from "lucide-react";
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from "@/lib/utils";

// Content type configuration based on URL path
interface NotFoundContent {
  title: string;
  description: string;
  icon: React.ElementType;
  primaryAction: {
    label: string;
    path: string;
    icon: React.ElementType;
  };
}

const getNotFoundContent = (pathname: string): NotFoundContent => {
  if (pathname.startsWith('/track/') || pathname.startsWith('/tracks/')) {
    return {
      title: 'Трек не найден',
      description: 'Этот трек был удалён или никогда не существовал',
      icon: Music2,
      primaryAction: { label: 'К библиотеке', path: '/library', icon: ListMusic },
    };
  }
  if (pathname.startsWith('/project/') || pathname.startsWith('/projects/')) {
    return {
      title: 'Проект не найден',
      description: 'Этот проект был удалён или недоступен',
      icon: FolderOpen,
      primaryAction: { label: 'К проектам', path: '/projects', icon: FolderOpen },
    };
  }
  if (pathname.startsWith('/playlist/') || pathname.startsWith('/playlists/')) {
    return {
      title: 'Плейлист не найден',
      description: 'Этот плейлист был удалён или стал приватным',
      icon: ListMusic,
      primaryAction: { label: 'К плейлистам', path: '/library?tab=playlists', icon: ListMusic },
    };
  }
  if (pathname.startsWith('/user/') || pathname.startsWith('/profile/')) {
    return {
      title: 'Пользователь не найден',
      description: 'Этот профиль не существует или скрыт',
      icon: User,
      primaryAction: { label: 'Сообщество', path: '/community', icon: User },
    };
  }
  if (pathname.startsWith('/artist/') || pathname.startsWith('/artists/')) {
    return {
      title: 'Артист не найден',
      description: 'Этот AI-артист был удалён или недоступен',
      icon: Mic2,
      primaryAction: { label: 'К артистам', path: '/artists', icon: Mic2 },
    };
  }
  if (pathname.startsWith('/studio')) {
    return {
      title: 'Студия недоступна',
      description: 'Выберите трек для открытия в студии',
      icon: Radio,
      primaryAction: { label: 'К библиотеке', path: '/library', icon: ListMusic },
    };
  }
  
  // Default
  return {
    title: 'Страница не найдена',
    description: 'Похоже, эта страница взяла паузу. Вернёмся к музыке?',
    icon: Disc3,
    primaryAction: { label: 'На главную', path: '/', icon: Home },
  };
};

// Animated broken record component
const BrokenRecord = () => (
  <motion.div
    className="relative w-32 h-32 sm:w-40 sm:h-40"
    initial={{ rotate: 0, scale: 0.8 }}
    animate={{ rotate: 360, scale: 1 }}
    transition={{ 
      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
      scale: { duration: 0.5, ease: 'easeOut' }
    }}
  >
    {/* Vinyl disc */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800 shadow-2xl">
      {/* Grooves */}
      <div className="absolute inset-[12%] rounded-full border border-zinc-700/40" />
      <div className="absolute inset-[22%] rounded-full border border-zinc-700/40" />
      <div className="absolute inset-[32%] rounded-full border border-zinc-700/40" />
      
      {/* Center label */}
      <motion.div 
        className="absolute inset-[38%] rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-3 h-3 rounded-full bg-background" />
      </motion.div>
    </div>
    
    {/* Crack effect */}
    <motion.div
      className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-b from-red-500/60 via-red-400/40 to-transparent origin-top"
      style={{ transform: 'translate(-50%, 0) rotate(25deg)' }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    
    {/* Shine effect */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent"
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.div>
);

// Floating music notes around the error
const FloatingNotes = () => {
  const notes = [
    { Icon: Music2, delay: 0, x: -60, y: -40 },
    { Icon: Radio, delay: 0.5, x: 70, y: -30 },
    { Icon: Disc3, delay: 1, x: -50, y: 50 },
    { Icon: HeadphonesIcon, delay: 1.5, x: 60, y: 60 },
  ];

  return (
    <>
      {notes.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute text-muted-foreground/30"
          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay,
            ease: 'easeInOut',
          }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      ))}
    </>
  );
};

// Sound wave animation
const SoundWave = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-0.5 bg-muted-foreground/30 rounded-full"
        initial={{ height: 4 }}
        animate={{ 
          height: [4, 8 + Math.sin(i * 0.5) * 12, 4],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 0.8 + Math.random() * 0.4,
          repeat: Infinity,
          delay: i * 0.05,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback, showBackButton, hideBackButton } = useTelegram();
  const [glitchEffect, setGlitchEffect] = useState(false);

  // Get contextual content based on URL
  const content = useMemo(() => getNotFoundContent(location.pathname), [location.pathname]);
  const ContentIcon = content.icon;
  const ActionIcon = content.primaryAction.icon;

  useEffect(() => {
    logger.error("404 Error: Page not found", undefined, { path: location.pathname });
    
    // Show Telegram back button
    showBackButton(() => {
      hapticFeedback('light');
      navigate(-1);
    });

    // Occasional glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 150);
    }, 4000);

    return () => {
      hideBackButton();
      clearInterval(glitchInterval);
    };
  }, [location.pathname, showBackButton, hideBackButton, hapticFeedback, navigate]);

  const handlePrimaryAction = () => {
    hapticFeedback('medium');
    navigate(content.primaryAction.path);
  };

  const handleGoBack = () => {
    hapticFeedback('light');
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-destructive/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Visual elements container */}
        <div className="relative flex flex-col items-center">
          {/* Floating notes around the record */}
          <FloatingNotes />
          
          {/* Broken record animation */}
          <motion.div
            className="mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
          >
            <BrokenRecord />
          </motion.div>

          {/* 404 with glitch effect */}
          <motion.div
            className={cn(
              "relative text-7xl sm:text-8xl font-black mb-2",
              glitchEffect && "animate-pulse"
            )}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <span className="text-gradient">4</span>
            <motion.span 
              className="text-destructive inline-block"
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              0
            </motion.span>
            <span className="text-gradient">4</span>
            
            {/* Glitch layers */}
            <AnimatePresence>
              {glitchEffect && (
                <>
                  <motion.div
                    className="absolute inset-0 text-primary/50"
                    style={{ transform: 'translate(-2px, -1px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                  >
                    404
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 text-generate/50"
                    style={{ transform: 'translate(2px, 1px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                  >
                    404
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sound wave decoration */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <SoundWave />
          </motion.div>

          {/* Contextual icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring" }}
            className="mb-3"
          >
            <ContentIcon className="w-8 h-8 text-muted-foreground/60" />
          </motion.div>

          {/* Title - contextual */}
          <motion.h1
            className="text-xl sm:text-2xl font-bold text-center mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {content.title}
          </motion.h1>

          {/* Description - contextual */}
          <motion.p
            className="text-sm text-muted-foreground text-center mb-6 max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {content.description}
          </motion.p>

          {/* Path info */}
          {location.pathname && location.pathname !== '/' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="w-full mb-6 rounded-xl bg-muted/30 border border-border/50 p-3"
            >
              <p className="text-xs text-muted-foreground break-all text-center font-mono">
                {location.pathname}
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            className="w-full space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              onClick={handlePrimaryAction} 
              className="w-full h-12 text-base"
              size="lg"
            >
              <ActionIcon className="mr-2 h-5 w-5" />
              {content.primaryAction.label}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleGoBack} 
                variant="outline"
                className="h-11"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
              
              <Button 
                onClick={() => {
                  hapticFeedback('light');
                  navigate('/');
                }} 
                variant="outline"
                className="h-11"
              >
                <Home className="mr-2 h-4 w-4" />
                Главная
              </Button>
            </div>
          </motion.div>

          {/* Help text with subtle animation */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-xs text-muted-foreground/60 text-center"
          >
            Нужна помощь? Напишите @AIMusicVerseBot
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;