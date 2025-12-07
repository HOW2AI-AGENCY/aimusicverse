import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { UserLevel } from '@/components/gamification/UserLevel';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { TransactionHistory } from '@/components/gamification/TransactionHistory';
import { StreakCalendar } from '@/components/gamification/StreakCalendar';
import { DailyMissions } from '@/components/gamification/DailyMissions';
import { QuickStats } from '@/components/gamification/QuickStats';
import { Trophy, Crown, History, Target } from 'lucide-react';

export default function Rewards() {
  return (
    <div className="min-h-screen pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold mb-1">Награды</h1>
          <p className="text-muted-foreground text-sm">
            Выполняй миссии и открывай достижения
          </p>
        </motion.div>

        {/* Level & Check-in Section */}
        <div className="space-y-4 mb-6">
          <UserLevel />
          <DailyCheckin />
          <StreakCalendar />
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <QuickStats />
        </motion.div>

        {/* Daily Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <DailyMissions />
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="achievements" className="gap-1 text-xs">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Мои</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 text-xs">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Все</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1 text-xs">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Топ</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs">
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
      </div>
    </div>
  );
}