import { motion } from 'framer-motion';
import { useCreditTransactions } from '@/hooks/useGamification';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
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
  FolderOpen
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
      <div className="text-center py-8 text-muted-foreground">
        <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>История пуста</p>
        <p className="text-sm">Выполняйте действия, чтобы зарабатывать кредиты</p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const date = format(new Date(tx.created_at), 'd MMMM', { locale: ru });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{date}</h3>
          <div className="space-y-2">
            {dayTransactions.map((tx, index) => {
              const isEarn = tx.transaction_type === 'earn';
              const icon = ACTION_ICONS[tx.action_type] || <Coins className="w-4 h-4" />;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${isEarn ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'HH:mm')}
                          </p>
                        </div>
                        <Badge 
                          variant={isEarn ? 'default' : 'destructive'}
                          className="gap-1"
                        >
                          {isEarn ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isEarn ? '+' : '-'}{Math.abs(tx.amount)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
