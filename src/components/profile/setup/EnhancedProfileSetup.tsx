import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from '@/lib/motion';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { useTelegramMainButton } from '@/hooks/telegram';
import { ProfileSetupStep1Basic } from './ProfileSetupStep1Basic';
import { ProfileSetupStep2About } from './ProfileSetupStep2About';
import { ProfileSetupStep3Social } from './ProfileSetupStep3Social';
import { ProfileSetupStep4Banner } from './ProfileSetupStep4Banner';
import { ProfileProgressIndicator } from './ProfileProgressIndicator';
import type { SocialLinks } from '@/types/profile';

interface EnhancedProfileSetupProps {
  onComplete: () => void;
  onDismiss?: () => void;
}

export interface ProfileSetupData {
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: 'producer' | 'musician' | 'listener' | '';
  genres: string[];
  socialLinks: SocialLinks;
  bannerUrl: string;
}

const STEPS = [
  { id: 1, title: 'Основа', description: 'Имя и фото' },
  { id: 2, title: 'О себе', description: 'Биография' },
  { id: 3, title: 'Соцсети', description: 'Ссылки' },
  { id: 4, title: 'Баннер', description: 'Оформление' },
];

export function EnhancedProfileSetup({ onComplete, onDismiss }: EnhancedProfileSetupProps) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileSetupData>({
    displayName: '',
    username: '',
    avatarUrl: '',
    bio: '',
    role: '',
    genres: [],
    socialLinks: {},
    bannerUrl: '',
  });

  // Import from existing profile OR Telegram data
  useEffect(() => {
    if (profile) {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      setFormData(prev => ({
        ...prev,
        displayName: fullName || profile.first_name || '',
        username: profile.username || '',
        avatarUrl: profile.photo_url || '',
      }));
    }
  }, [profile]);

  const updateFormData = (updates: Partial<ProfileSetupData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.displayName.trim().length > 0;
      case 2:
        return true; // Bio is optional
      case 3:
        return true; // Social links are optional
      case 4:
        return true; // Banner is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Filter out empty social links
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(formData.socialLinks).filter(([_, value]) => value && value.trim())
      );

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.displayName.split(' ')[0] || formData.displayName,
          last_name: formData.displayName.split(' ').slice(1).join(' ') || null,
          display_name: formData.displayName.trim(),
          username: formData.username.trim() || null,
          photo_url: formData.avatarUrl || null,
          bio: formData.bio.trim() || null,
          social_links: filteredSocialLinks,
          banner_url: formData.bannerUrl || null,
          is_public: true, // Always public for free users
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate profile cache to trigger needsSetup recalculation
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Профиль создан! 🎉');
      onComplete();
    } catch (error) {
      logger.error('Error saving profile', error instanceof Error ? error : new Error(String(error)), {
        userId: user?.id
      });
      toast.error('Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  // Telegram MainButton integration
  const isLastStep = currentStep === STEPS.length;
  const mainButtonText = isSaving ? 'Сохранение...' : (isLastStep ? 'ЗАВЕРШИТЬ' : 'ДАЛЕЕ');
  const mainButtonAction = isLastStep ? handleComplete : handleNext;
  
  const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
    text: mainButtonText,
    onClick: mainButtonAction,
    enabled: !isSaving && canProceed(),
    visible: true,
  });

  // Show/hide progress when saving
  useEffect(() => {
    if (isSaving) {
      showProgress(true);
    } else {
      hideProgress();
    }
  }, [isSaving, showProgress, hideProgress]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg my-4"
      >
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </motion.div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold">Настройте профиль</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Шаг {currentStep} из {STEPS.length}: {STEPS[currentStep - 1].description}
                </p>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Пропустить
                </Button>
              )}
            </div>
            
            <ProfileProgressIndicator 
              steps={STEPS} 
              currentStep={currentStep} 
            />
          </div>

          <CardContent className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <ProfileSetupStep1Basic
                  key="step1"
                  data={formData}
                  onUpdate={updateFormData}
                  userId={user?.id}
                />
              )}
              {currentStep === 2 && (
                <ProfileSetupStep2About
                  key="step2"
                  data={formData}
                  onUpdate={updateFormData}
                />
              )}
              {currentStep === 3 && (
                <ProfileSetupStep3Social
                  key="step3"
                  data={formData}
                  onUpdate={updateFormData}
                />
              )}
              {currentStep === 4 && (
                <ProfileSetupStep4Banner
                  key="step4"
                  data={formData}
                  onUpdate={updateFormData}
                  userId={user?.id}
                />
              )}
            </AnimatePresence>

            {/* Navigation - only show UI buttons for test users */}
            {shouldShowUIButton && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                )}
                
                <div className="flex-1" />
                
                {currentStep < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="gap-1"
                  >
                    Далее
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={isSaving || !canProceed()}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      'Завершить'
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
