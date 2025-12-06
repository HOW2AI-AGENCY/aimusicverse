import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { UserLevel } from '@/components/gamification/UserLevel';
import { CreditsBalance } from '@/components/gamification/CreditsBalance';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { TransactionHistory } from '@/components/gamification/TransactionHistory';
import { Gift, Trophy, Crown, History } from 'lucide-react';

export default function Rewards() {
  return (
    <div className="min-h-screen pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold mb-1">Награды</h1>
          <p className="text-muted-foreground text-sm">
            Зарабатывай кредиты и открывай достижения
          </p>
        </motion.div>

        <div className="space-y-4 mb-6">
          <DailyCheckin />
          <div className="grid grid-cols-1 gap-4">
            <UserLevel />
            <CreditsBalance />
          </div>
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="achievements" className="gap-1 text-xs">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Достижения</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 text-xs">
              <Gift className="w-4 h-4" />
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
