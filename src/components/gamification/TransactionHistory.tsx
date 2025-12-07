import { motion, AnimatePresence } from 'framer-motion';
import { useCreditTransactions } from '@/hooks/useGamification';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  Share2, 
  Heart, 
  Music, 
  Flame,
  Trophy,
  User,
  FolderOpen,
  Sparkles
} from 'lucide-react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  checkin: <Gift className="w-4 h-4" />,
  share: <Share2 className="w-4 h-4" />,
  like_received: <Heart className="w-4 h-4" />,
  generation_complete: <Music className="w-4 h-4" />,
  streak_bonus: <Flame className="w-4 h-4" />,
  achievement: <Trophy className="w-4 h-4" />,
  public_track: <TrendingUp className="w-4 h-4" />,
  artist_created: <User className="w-4 h-4" />,
  project_created: <FolderOpen className="w-4 h-4" />,
  spend_generation: <Music className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  checkin: 'from-green-500/20 to-green-600/10 text-green-500',
  share: 'from-blue-500/20 to-blue-600/10 text-blue-500',
  like_received: 'from-pink-500/20 to-pink-600/10 text-pink-500',
  generation_complete: 'from-purple-500/20 to-purple-600/10 text-purple-500',
  streak_bonus: 'from-orange-500/20 to-orange-600/10 text-orange-500',
  achievement: 'from-yellow-500/20 to-yellow-600/10 text-yellow-500',
  public_track: 'from-cyan-500/20 to-cyan-600/10 text-cyan-500',
  artist_created: 'from-indigo-500/20 to-indigo-600/10 text-indigo-500',
  project_created: 'from-teal-500/20 to-teal-600/10 text-teal-500',
  spend_generation: 'from-red-500/20 to-red-600/10 text-red-500',
};

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Сегодня';
  if (isYesterday(date)) return 'Вчера';
  return format(date, 'd MMMM', { locale: ru });
}

export function TransactionHistory() {
  const { data: transactions, isLoading } = useCreditTransactions(50);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        </motion.div>
        <p className="text-muted-foreground font-medium">История пуста</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Выполняйте действия, чтобы зарабатывать кредиты
        </p>
      </motion.div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const dateKey = new Date(tx.created_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  return (
    <ScrollArea className="h-[400px] pr-2">
      <div className="space-y-4">
        <AnimatePresence>
          {Object.entries(groupedTransactions).map(([dateKey, dayTransactions], groupIndex) => (
            <motion.div 
              key={dateKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {getDateLabel(dayTransactions[0].created_at)}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {dayTransactions.length} операц.
                </span>
              </div>
              
              <div className="space-y-2">
                {dayTransactions.map((tx, index) => {
                  const isEarn = tx.transaction_type === 'earn';
                  const icon = ACTION_ICONS[tx.action_type] || <Coins className="w-4 h-4" />;
                  const colorClass = ACTION_COLORS[tx.action_type] || 'from-gray-500/20 to-gray-600/10 text-gray-500';
                  const metadata = tx.metadata as { experience_earned?: number } | null;

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              whileHover={{ rotate: 15 }}
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                            >
                              {icon}
                            </motion.div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{tx.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(new Date(tx.created_at), 'HH:mm')}</span>
                                {metadata?.experience_earned && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 text-primary">
                                      <Sparkles className="w-3 h-3" />
                                      +{metadata.experience_earned} XP
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                            >
                              <Badge 
                                variant={isEarn ? 'default' : 'destructive'}
                                className="gap-1 font-bold"
                              >
                                {isEarn ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {isEarn ? '+' : '-'}{Math.abs(tx.amount)}
                              </Badge>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
