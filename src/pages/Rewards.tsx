import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Trophy, Crown, History, Target, Gift, Calendar, Gem } from 'lucide-react';

export default function Rewards() {
  return (
    <div className="min-h-screen pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Header with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-500/10 to-primary/10 rounded-2xl blur-xl" />
          <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Gift className="w-6 h-6 text-primary" />
                  Награды
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Выполняй миссии и открывай достижения
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SoundToggle size="sm" />
                <CreditsBalance compact />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Level & Check-in Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-6"
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
          className="mb-6"
        >
          <QuickStats />
        </motion.div>

        {/* Missions Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-3 bg-muted/50">
              <TabsTrigger value="daily" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Target className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ежедневные</span>
                <span className="sm:hidden">День</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Еженедельные</span>
                <span className="sm:hidden">Неделя</span>
              </TabsTrigger>
              <TabsTrigger value="special" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Gem className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Особые</span>
                <span className="sm:hidden">VIP</span>
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
          <Tabs defaultValue="achievements" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4 bg-muted/50">
              <TabsTrigger value="achievements" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Мои</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Все</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Топ</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs data-[state=active]:bg-primary/10">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">История</span>
              </TabsTrigger>
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
  );
}