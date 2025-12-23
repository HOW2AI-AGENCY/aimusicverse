import { motion } from '@/lib/motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { TransactionHistory } from '@/components/gamification/TransactionHistory';
import { StreakCalendar } from '@/components/gamification/StreakCalendar';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { WeeklyChallenges } from '@/components/gamification/WeeklyChallenges';
import { SpecialChallenges } from '@/components/gamification/SpecialChallenges';
import { QuickStats } from '@/components/gamification/QuickStats';
import { CreditsBalance } from '@/components/gamification/CreditsBalance';
import { SoundToggle } from '@/components/gamification/SoundToggle';
import { Trophy, Crown, History, Target, Gift, Calendar, Gem, Sparkles, Info } from 'lucide-react';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { useTelegram } from '@/contexts/TelegramContext';

// Animated icon wrapper
const AnimatedIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ 
      type: 'spring', 
      stiffness: 260, 
      damping: 20,
      delay 
    }}
    whileHover={{ 
      scale: 1.2, 
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4 }
    }}
  >
    {children}
  </motion.div>
);

// Section header with tooltip
const SectionHeader = ({ 
  icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
}) => (
  <TooltipProvider>
    <motion.div 
      className="flex items-center gap-2 mb-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <AnimatedIcon delay={delay}>
        {icon}
      </AnimatedIcon>
      <h2 className="text-sm font-semibold">{title}</h2>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px] text-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  </TooltipProvider>
);

export default function Rewards() {
  const { webApp } = useTelegram();
  const isTelegramApp = !!webApp;
  
  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // Dynamic top padding for Telegram mini app
  const topPadding = isTelegramApp ? 'pt-14 sm:pt-6' : 'pt-6';

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-24">
        <div className={`container max-w-lg mx-auto px-3 sm:px-4 ${topPadding}`}>
          {/* Header with gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-6 relative"
          >
            {/* Animated background glow */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-500/10 to-primary/10 rounded-2xl blur-xl"
              animate={{ 
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-primary/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <motion.h1 
                    className="text-xl sm:text-2xl font-bold flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <AnimatedIcon delay={0.3}>
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </AnimatedIcon>
                    <span>Награды</span>
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </motion.h1>
                  <motion.p 
                    className="text-muted-foreground text-xs sm:text-sm mt-1 truncate"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Выполняй миссии и открывай достижения
                  </motion.p>
                </div>
                <motion.div 
                  className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SoundToggle size="sm" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Звуки наград
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <CreditsBalance compact />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Ваш баланс кредитов
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Level & Check-in Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 sm:space-y-4 mb-5 sm:mb-6"
          >
            <UserLevel />
            <DailyCheckin />
            <StreakCalendar />
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5 sm:mb-6"
          >
            <SectionHeader 
              icon={<Sparkles className="w-4 h-4 text-primary" />}
              title="Статистика"
              description="Ваш прогресс и достижения за всё время"
              delay={0.2}
            />
            <QuickStats />
          </motion.div>

          {/* Missions Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5 sm:mb-6"
          >
            <SectionHeader 
              icon={<Target className="w-4 h-4 text-green-400" />}
              title="Миссии"
              description="Выполняй задания и получай награды"
              delay={0.3}
            />
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-3 bg-muted/50 h-9">
                <TabsTrigger value="daily" className="gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full">
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
                    <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.div>
                  <span>День</span>
                </TabsTrigger>
                <TabsTrigger value="weekly" className="gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full">
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.div>
                  <span>Неделя</span>
                </TabsTrigger>
                <TabsTrigger value="special" className="gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full">
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0] }} 
                    transition={{ duration: 0.3 }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    style={{ animation: 'pulse 2s infinite' }}
                  >
                    <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.div>
                  <span>VIP</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="mt-0">
                <DailyMissions />
              </TabsContent>
              
              <TabsContent value="weekly" className="mt-0">
                <WeeklyChallenges />
              </TabsContent>
              
              <TabsContent value="special" className="mt-0">
                <SpecialChallenges />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Achievements & Leaderboard Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SectionHeader 
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
              title="Достижения"
              description="Коллекционируй награды и соревнуйся с другими"
              delay={0.4}
            />
            <Tabs defaultValue="achievements" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-3 sm:mb-4 bg-muted/50 h-9">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="achievements" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full px-1 sm:px-2">
                      <motion.div whileHover={{ scale: 1.2, rotate: 15 }} transition={{ duration: 0.2 }}>
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.div>
                      <span className="hidden xs:inline">Мои</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Ваши достижения</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full px-1 sm:px-2">
                      <motion.div whileHover={{ scale: 1.2, rotate: -15 }} transition={{ duration: 0.2 }}>
                        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.div>
                      <span className="hidden xs:inline">Все</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Все достижения</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="leaderboard" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full px-1 sm:px-2">
                      <motion.div 
                        whileHover={{ scale: 1.2 }} 
                        transition={{ duration: 0.2 }}
                        animate={{ y: [0, -2, 0] }}
                      >
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.div>
                      <span className="hidden xs:inline">Топ</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Таблица лидеров</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="history" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs data-[state=active]:bg-primary/10 h-full px-1 sm:px-2">
                      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                        <History className="w-3 h-3 sm:w-4 sm:h-4" />
                      </motion.div>
                      <span className="hidden xs:inline">Лог</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">История транзакций</TooltipContent>
                </Tooltip>
              </TabsList>

              <TabsContent value="achievements" className="mt-0">
                <AchievementsList showAll={false} />
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                <AchievementsList showAll={true} />
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-0">
                <Leaderboard />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <TransactionHistory />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
