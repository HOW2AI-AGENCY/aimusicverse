/**
 * Referral Page - Dedicated page for referral program
 * Features: QR code, stats, leaderboard, share options
 */

import { useState, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Gift, Share2, Copy, QrCode, Trophy, 
  Sparkles, ArrowRight, Crown, Medal, Star,
  Download, Link2
} from 'lucide-react';
import { useReferralStats, useShareReferral, useReferralLink } from '@/hooks/useReferrals';
import { useReferralLeaderboard } from '@/hooks/useReferralLeaderboard';
import { ECONOMY } from '@/lib/economy';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

// Dynamic QR code generation
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const generateQR = async () => {
      try {
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        if (!cancelled) {
          setQrDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('QR generation failed:', err);
        if (!cancelled) setLoading(false);
      }
    };

    generateQR();
    return () => { cancelled = true; };
  }, [value, size]);

  if (loading) {
    return <Skeleton className="w-[200px] h-[200px] rounded-xl" />;
  }

  if (!qrDataUrl) {
    return (
      <div className="w-[200px] h-[200px] bg-muted rounded-xl flex items-center justify-center">
        <QrCode className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.img 
      src={qrDataUrl} 
      alt="Referral QR Code"
      className="rounded-xl shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
}

// Leaderboard item component
function LeaderboardItem({ 
  rank, 
  displayName, 
  avatarUrl, 
  referralCount, 
  isCurrentUser 
}: { 
  rank: number;
  displayName: string;
  avatarUrl?: string | null;
  referralCount: number;
  isCurrentUser: boolean;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center font-medium text-muted-foreground">{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
      )}
    >
      <div className="w-8 flex justify-center">{getRankIcon()}</div>
      
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isCurrentUser && "text-primary"
        )}>
          {displayName}
          {isCurrentUser && <span className="text-xs ml-1">(вы)</span>}
        </p>
      </div>
      
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Users className="w-4 h-4 text-muted-foreground" />
        {referralCount}
      </div>
    </motion.div>
  );
}

export default function Referral() {
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: leaderboard, isLoading: leaderboardLoading } = useReferralLeaderboard();
  const { share } = useShareReferral();
  const referralLink = useReferralLink();
  const { hapticFeedback } = useTelegram();
  
  // Back button for Telegram
  useTelegramBackButton();

  const handleShare = async () => {
    hapticFeedback?.('light');
    await share();
  };

  const handleCopyCode = async () => {
    if (stats?.referralCode) {
      hapticFeedback?.('light');
      await navigator.clipboard.writeText(stats.referralCode);
      toast.success('Код скопирован!');
    }
  };

  const handleCopyLink = async () => {
    if (referralLink) {
      hapticFeedback?.('light');
      await navigator.clipboard.writeText(referralLink);
      toast.success('Ссылка скопирована!');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Gift className="w-4 h-4" />
            Реферальная программа
          </div>
          <h1 className="text-2xl font-bold">Приглашай друзей</h1>
          <p className="text-muted-foreground text-sm">
            Получай <span className="text-primary font-semibold">{ECONOMY.REFERRAL_INVITE_BONUS}</span> кредитов за каждого друга
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-primary">
                  <Users className="w-5 h-5" />
                  {stats?.referralCount || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Приглашено</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-emerald-500">
                  <Sparkles className="w-5 h-5" />
                  {stats?.referralEarnings || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Заработано</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              Лидеры
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="mt-4 space-y-4">
            {/* QR Code Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 flex flex-col items-center space-y-4">
                  {referralLink ? (
                    <QRCodeDisplay value={referralLink} size={200} />
                  ) : (
                    <Skeleton className="w-[200px] h-[200px] rounded-xl" />
                  )}
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Покажи QR-код другу или отправь ссылку
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Referral Code */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Твой код</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg text-center font-bold tracking-wider">
                      {statsLoading ? (
                        <Skeleton className="h-6 w-24 mx-auto" />
                      ) : (
                        stats?.referralCode || '---'
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      className="h-12 w-12"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Link copy */}
                  <Button
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={handleCopyLink}
                  >
                    <Link2 className="w-4 h-4" />
                    Скопировать ссылку
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Share Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleShare}
                className="w-full h-14 text-base font-semibold gap-2"
                size="lg"
              >
                <Share2 className="w-5 h-5" />
                Поделиться с друзьями
              </Button>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Как это работает
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</div>
                    <p className="text-sm text-muted-foreground">Поделись ссылкой или QR-кодом с другом</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</div>
                    <p className="text-sm text-muted-foreground">Друг регистрируется и получает <span className="font-semibold text-foreground">{ECONOMY.REFERRAL_NEW_USER_BONUS}</span> кредитов</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</div>
                    <p className="text-sm text-muted-foreground">Ты получаешь <span className="font-semibold text-foreground">{ECONOMY.REFERRAL_INVITE_BONUS}</span> кредитов после регистрации</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Топ рефереров
                </CardTitle>
                <CardDescription>
                  Пользователи с наибольшим количеством приглашений
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-2">
                  {leaderboardLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                          <Skeleton className="w-8 h-5" />
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <Skeleton className="flex-1 h-5" />
                          <Skeleton className="w-12 h-5" />
                        </div>
                      ))}
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((item, index) => (
                        <LeaderboardItem
                          key={item.userId}
                          rank={index + 1}
                          displayName={item.displayName}
                          avatarUrl={item.avatarUrl}
                          referralCount={item.referralCount}
                          isCurrentUser={item.isCurrentUser}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Пока нет данных</p>
                      <p className="text-sm">Стань первым!</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
