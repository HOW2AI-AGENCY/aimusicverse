import { motion } from '@/lib/motion';
import { Card, CardContent } from '@/components/ui/card';
import { useUserCredits } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Flame, Music, Trophy } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  delay: number;
}

function StatItem({ icon, label, value, subValue, color, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center"
    >
      <div className={`w-12 h-12 mx-auto rounded-xl ${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && (
        <p className="text-[10px] text-primary mt-0.5">{subValue}</p>
      )}
    </motion.div>
  );
}

export function QuickStats() {
  const { user } = useAuth();
  const { data: credits } = useUserCredits();
  
  const { data: stats } = useQuery({
    queryKey: ['user-quick-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get total tracks count
      const { count: tracksCount } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      // Get achievements count
      const { count: achievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      return {
        tracks: tracksCount || 0,
        achievements: achievementsCount || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <StatItem
            icon={<Coins className="w-5 h-5 text-yellow-600" />}
            label="Кредиты"
            value={credits?.balance || 0}
            color="bg-yellow-500/20"
            delay={0}
          />
          <StatItem
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Серия"
            value={credits?.current_streak || 0}
            subValue={credits?.longest_streak ? `рекорд: ${credits.longest_streak}` : undefined}
            color="bg-orange-500/20"
            delay={0.1}
          />
          <StatItem
            icon={<Music className="w-5 h-5 text-blue-500" />}
            label="Треки"
            value={stats?.tracks || 0}
            color="bg-blue-500/20"
            delay={0.2}
          />
          <StatItem
            icon={<Trophy className="w-5 h-5 text-purple-500" />}
            label="Награды"
            value={stats?.achievements || 0}
            color="bg-purple-500/20"
            delay={0.3}
          />
        </div>
      </CardContent>
    </Card>
  );
}