/**
 * Settings Page
 * 
 * User settings management with modular tab components.
 * Business logic delegated to useSettingsPage hook.
 * 
 * @see src/hooks/useSettingsPage.ts
 */

import { Loader2 } from "lucide-react";
import { 
  User, Bell, Shield, Palette, Music, Send, Lightbulb, BarChart3, CreditCard,
  Settings as SettingsIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from '@/lib/motion';
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useSettingsPage } from "@/hooks/useSettingsPage";

// Tab components
import { ProfileTab, NotificationsTab, PrivacyTab, TelegramTab } from "@/components/settings/tabs";

// Existing components for simple tabs
import { SubscriptionManagement } from "@/components/payments/SubscriptionManagement";
import { InviteFriendsCard } from "@/components/gamification/InviteFriendsCard";
import { UserStatsSection } from "@/components/settings/UserStatsSection";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { HintsSettings } from "@/components/settings/HintsSettings";
import { MidiSettingsSection } from "@/components/settings/MidiSettingsSection";

export default function Settings() {
  const settings = useSettingsPage();

  if (settings.profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5"
      style={settings.getContainerStyle(96)}
    >
      <div className="container max-w-2xl mx-auto px-4">
        <AppHeader
          title="Настройки"
          subtitle="Управление аккаунтом"
          icon={<SettingsIcon className="w-3.5 h-3.5 text-primary" />}
          rightAction={<NotificationBadge />}
        />

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(55px, 1fr))' }}>
            <TabsTrigger value="profile" className="gap-1 px-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1 px-1">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Подписка</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1 px-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Статистика</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1 px-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Тема</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1 px-1">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Приватность</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 px-1">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="hints" className="gap-1 px-1">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Подсказки</span>
            </TabsTrigger>
            <TabsTrigger value="midi" className="gap-1 px-1">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">MIDI</span>
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-1 px-1">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Telegram</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <ProfileTab
              profile={settings.profile}
              firstName={settings.firstName}
              lastName={settings.lastName}
              onFirstNameChange={settings.setFirstName}
              onLastNameChange={settings.setLastName}
              onAvatarUpload={settings.updateAvatar}
              onSave={settings.saveProfile}
              isSaving={settings.isSaving}
              createFocusHandler={settings.createFocusHandler}
            />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SubscriptionManagement />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <InviteFriendsCard />
            </motion.div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <UserStatsSection />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <ThemeSettings />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <PrivacyTab onNavigate={settings.navigateTo} />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationsTab
              settings={settings.notificationSettings}
              isUpdating={settings.isUpdating}
              onToggle={settings.toggleNotification}
              onUpdateSettings={settings.updateSettings}
              createFocusHandler={settings.createFocusHandler}
            />
          </TabsContent>

          {/* Hints Tab */}
          <TabsContent value="hints" className="space-y-4">
            <HintsSettings />
          </TabsContent>

          {/* MIDI Tab */}
          <TabsContent value="midi" className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <MidiSettingsSection />
            </motion.div>
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="space-y-4">
            <TelegramTab />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <motion.div
          className="mt-6 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-primary"
              onClick={() => settings.navigateTo('/terms')}
            >
              Условия использования
            </Button>
            <span>•</span>
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-primary"
              onClick={() => settings.navigateTo('/privacy')}
            >
              Конфиденциальность
            </Button>
          </div>
          <p className="mt-2 text-xs">
            MusicVerse AI © 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
}
