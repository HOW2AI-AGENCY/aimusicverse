import { useEffect } from "react";
import { motion } from '@/lib/motion';
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

// Musical equalizer bars
const EqualizerBar = ({ delay = 0, maxHeight = 20 }: { delay?: number; maxHeight?: number }) => (
  <motion.div
    className="w-1.5 bg-gradient-to-t from-primary via-primary/80 to-primary/40 rounded-full"
    initial={{ height: 4 }}
    animate={{ 
      height: [4, maxHeight, 4],
    }}
    transition={{
      duration: 0.6,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl"
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-generate/6 rounded-full blur-3xl"
          animate={{
            x: [0, -60, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative flex flex-col items-center z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Logo with pulsing glow */}
        <motion.div
          className="relative mb-6"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-6 rounded-[2rem] bg-primary/20 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Inner glow */}
          <motion.div
            className="absolute -inset-3 rounded-3xl bg-primary/30 blur-xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Logo container */}
          <div className="relative p-3 rounded-3xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-2xl">
            <img 
              src={logo} 
              alt="MusicVerse" 
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl" 
            />
          </div>
        </motion.div>

        {/* App name with gradient */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-gradient mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          MusicVerse AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-sm sm:text-base mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          Генерация музыки с AI
        </motion.p>

        {/* Musical equalizer loading indicator */}
        <motion.div
          className="flex items-end justify-center gap-1.5 h-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <EqualizerBar 
              key={i} 
              delay={i * 0.08} 
              maxHeight={12 + Math.sin(i * 0.7) * 10 + 6}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom decorative line */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full overflow-hidden bg-border"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
};
