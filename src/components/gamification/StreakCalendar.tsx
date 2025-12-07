import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckinDay {
  checkin_date: string;
  credits_earned: number;
  streak_day: number;
}

export function StreakCalendar() {
  const { user } = useAuth();
  
  const { data: checkins, isLoading } = useQuery({
    queryKey: ['user-checkins-calendar', user?.id],
    queryFn: async (): Promise<CheckinDay[]> => {
      if (!user?.id) return [];
      
      // Get last 30 days of checkins
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('user_checkins')
        .select('checkin_date, credits_earned, streak_day')
        .eq('user_id', user.id)
        .gte('checkin_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('checkin_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const checkinDates = new Set(checkins?.map(c => c.checkin_date) || []);
  const today = new Date().toISOString().split('T')[0];

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Календарь активности
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between gap-1">
          {last7Days.map((date, index) => {
            const isCheckedIn = checkinDates.has(date);
            const isToday = date === today;
            const dayOfWeek = new Date(date).getDay();
            const dayNum = new Date(date).getDate();
            
            return (
              <motion.div
                key={date}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[10px] text-muted-foreground">
                  {dayNames[dayOfWeek]}
                </span>
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                    isCheckedIn 
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30" 
                      : isToday
                        ? "bg-primary/20 border-2 border-dashed border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCheckedIn ? (
                    <Flame className="w-4 h-4" />
                  ) : (
                    dayNum
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Stats */}
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <span>
            Чекинов за неделю: <strong className="text-foreground">{last7Days.filter(d => checkinDates.has(d)).length}/7</strong>
          </span>
          <span>
            Всего: <strong className="text-foreground">{checkins?.length || 0}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}