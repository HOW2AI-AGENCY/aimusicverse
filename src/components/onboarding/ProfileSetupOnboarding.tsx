import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  User, Camera, Globe, Bell, Shield, ChevronRight, 
  CheckCircle, X, Upload, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface ProfileSetupOnboardingProps {
  userId: string;
  initialProfile?: {
    first_name?: string;
    username?: string;
    photo_url?: string;
  };
  onComplete: () => void;
  onSkip?: () => void;
}

const STORAGE_KEY = 'musicverse_profile_setup_completed';

const steps = [
  {
    id: 'welcome',
    title: 'Давайте настроим ваш профиль',
    description: 'Это займёт пару минут и поможет другим пользователям найти вас.',
  },
  {
    id: 'profile',
    title: 'Ваш профиль',
    description: 'Добавьте фото и имя для публичного профиля.',
  },
  {
    id: 'privacy',
    title: 'Настройки приватности',
    description: 'Выберите, что будет видно другим пользователям.',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Настройте, какие уведомления вы хотите получать.',
  },
  {
    id: 'complete',
    title: 'Готово!',
    description: 'Ваш профиль настроен и готов к использованию.',
  },
];

export function ProfileSetupOnboarding({ 
  userId, 
  initialProfile, 
  onComplete, 
  onSkip 
}: ProfileSetupOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile data
  const [displayName, setDisplayName] = useState(initialProfile?.first_name || '');
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.photo_url || '');
  
  // Privacy settings
  const [isPublic, setIsPublic] = useState(true);
  const [showTracks, setShowTracks] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  
  // Notification settings
  const [notifyCompleted, setNotifyCompleted] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyAchievements, setNotifyAchievements] = useState(true);
  const [notifyDailyReminder, setNotifyDailyReminder] = useState(false);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate profile
      if (!displayName.trim()) {
        toast.error('Введите имя для профиля');
        return;
      }
    }
    
    if (isLast) {
      await saveProfile();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: displayName,
          username: username || null,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
      
      // Update notification settings
      const { error: notifError } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: userId,
          notify_completed: notifyCompleted,
          notify_likes: notifyLikes,
          notify_achievements: notifyAchievements,
          notify_daily_reminder: notifyDailyReminder,
          updated_at: new Date().toISOString(),
        });
      
      if (notifError) throw notifError;
      
      localStorage.setItem(STORAGE_KEY, 'true');
      toast.success('Профиль успешно настроен!');
      onComplete();
    } catch (error) {
      logger.error('Error saving profile', error instanceof Error ? error : new Error(String(error)), {
        userId
      });
      toast.error('Ошибка сохранения профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5МБ)');
      return;
    }
    
    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      
      // Update profile with new avatar
      await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);
      
      toast.success('Фото загружено');
    } catch (error) {
      logger.error('Error uploading avatar', error instanceof Error ? error : new Error(String(error)), {
        userId
      });
      toast.error('Ошибка загрузки фото');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Добро пожаловать в MusicVerse!</h2>
            <p className="text-muted-foreground mb-6">
              Создавайте музыку с помощью AI, делитесь треками и общайтесь с другими музыкантами.
            </p>
            <div className="space-y-2 text-left bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Публичный профиль для сообщества</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Персональные рекомендации</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Уведомления о важных событиях</span>
              </div>
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="space-y-6 py-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {displayName?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Нажмите на иконку камеры для загрузки фото
              </p>
            </div>
            
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Отображаемое имя *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как вас называть?"
                className="text-center"
              />
            </div>
            
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Юзернейм (опционально)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Публичный профиль</p>
                  <p className="text-xs text-muted-foreground">
                    Другие пользователи смогут видеть ваш профиль
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <User className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Показывать треки</p>
                  <p className="text-xs text-muted-foreground">
                    Публичные треки видны в вашем профиле
                  </p>
                </div>
              </div>
              <Switch checked={showTracks} onCheckedChange={setShowTracks} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Показывать активность</p>
                  <p className="text-xs text-muted-foreground">
                    Статистика и достижения видны другим
                  </p>
                </div>
              </div>
              <Switch checked={showActivity} onCheckedChange={setShowActivity} />
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Вы сможете изменить эти настройки позже в профиле
            </p>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="font-medium text-sm">Генерация завершена</p>
                <p className="text-xs text-muted-foreground">
                  Когда трек готов к прослушиванию
                </p>
              </div>
              <Switch checked={notifyCompleted} onCheckedChange={setNotifyCompleted} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="font-medium text-sm">Лайки на треки</p>
                <p className="text-xs text-muted-foreground">
                  Когда кто-то лайкает ваш трек
                </p>
              </div>
              <Switch checked={notifyLikes} onCheckedChange={setNotifyLikes} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="font-medium text-sm">Достижения</p>
                <p className="text-xs text-muted-foreground">
                  Новые разблокированные достижения
                </p>
              </div>
              <Switch checked={notifyAchievements} onCheckedChange={setNotifyAchievements} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="font-medium text-sm">Ежедневное напоминание</p>
                <p className="text-xs text-muted-foreground">
                  Напоминание о ежедневном чекине
                </p>
              </div>
              <Switch checked={notifyDailyReminder} onCheckedChange={setNotifyDailyReminder} />
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Профиль готов!</h2>
            <p className="text-muted-foreground mb-6">
              Теперь вы можете создавать музыку и делиться ей с сообществом.
            </p>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary">
                💡 Совет: Начните с генерации первого трека или изучите граф музыкальных связей
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Progress */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Шаг {currentStep + 1} из {steps.length}
              </p>
              <h2 className="text-lg font-bold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            {onSkip && currentStep < steps.length - 1 && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-4 flex gap-3">
          {!isFirst && !isLast && (
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Назад
            </Button>
          )}
          <Button 
            className="flex-1 gap-2" 
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : isLast ? 'Начать' : 'Далее'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useProfileSetupCheck() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkProfileSetup();
  }, []);

  const checkProfileSetup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }
      
      setUserId(user.id);
      
      // Check localStorage first
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed) {
        setIsChecking(false);
        return;
      }
      
      // Check if profile has been set up
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        // Check if profile needs setup (no is_public set explicitly)
        if (profileData.is_public === null || profileData.is_public === undefined) {
          setNeedsSetup(true);
        }
      }
    } catch (error) {
      logger.error('Error checking profile', error instanceof Error ? error : new Error(String(error)), {
        userId
      });
    } finally {
      setIsChecking(false);
    }
  };

  const completeSetup = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setNeedsSetup(false);
  };

  return {
    needsSetup,
    profile,
    userId,
    isChecking,
    completeSetup,
  };
}
