/**
 * Settings Page
 *
 * User settings management with modular tab components.
 * Desktop: vertical sidebar navigation
 * Mobile: horizontal tabs
 *
 * @see src/hooks/useSettingsPage.ts
 */

import { useState } from "react";
import { Loader2 } from "@/lib/icons";
import {
  User,
  Bell,
  Shield,
  Palette,
  Music,
  Send,
  Lightbulb,
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  MousePointerClick,
} from "@/lib/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useSettingsPage } from "@/hooks/useSettingsPage";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { cn } from "@/lib/utils";

// Tab components
import { ProfileTab, NotificationsTab, PrivacyTab, TelegramTab } from "@/components/settings/tabs";

// Existing components for simple tabs
import { SubscriptionManagement } from "@/components/payments/SubscriptionManagement";
import { InviteFriendsCard } from "@/components/gamification/InviteFriendsCard";
import { UserStatsSection } from "@/components/settings/UserStatsSection";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { HintsSettings } from "@/components/settings/HintsSettings";
import { MidiSettingsSection } from "@/components/settings/MidiSettingsSection";
import { GestureSettingsPanel } from "@/components/gestures/GestureSettingsPanel";

export default function Settings() {
  const settings = useSettingsPage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");

  if (settings.profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Content renderer for both mobile tabs and desktop sidebar
  const renderContent = (tab: string) => {
    switch (tab) {
      case "profile":
        return (
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
        );
      case "subscription":
        return (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SubscriptionManagement />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <InviteFriendsCard />
            </motion.div>
          </>
        );
      case "stats":
        return <UserStatsSection />;
      case "appearance":
        return <ThemeSettings />;
      case "privacy":
        return <PrivacyTab onNavigate={settings.navigateTo} />;
      case "notifications":
        return (
          <NotificationsTab
            settings={settings.notificationSettings as Record<string, unknown> | null | undefined}
            isUpdating={settings.isUpdating}
            onToggle={settings.toggleNotification}
            onUpdateSettings={settings.updateSettings}
            createFocusHandler={settings.createFocusHandler}
          />
        );
      case "hints":
        return <HintsSettings />;
      case "gestures":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GestureSettingsPanel />
          </motion.div>
        );
      case "midi":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MidiSettingsSection />
          </motion.div>
        );
      case "telegram":
        return <TelegramTab />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5"
      style={settings.getContainerStyle(isMobile ? 140 : 96)}
    >
      <div className={cn("container mx-auto px-3 sm:px-4", isMobile ? "max-w-2xl" : "max-w-6xl")}>
        <AppHeader
          title="Настройки"
          subtitle="Управление аккаунтом"
          icon={<SettingsIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />}
          rightAction={<NotificationBadge />}
          className="lg:py-4"
        />

        {/* Desktop: Sidebar + Content */}
        {!isMobile ? (
          <div className="flex gap-6 lg:gap-8 mt-4 lg:mt-6">
            <aside className="w-64 lg:w-72 flex-shrink-0 sticky top-20 self-start">
              <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </aside>
            <main className="flex-1 min-w-0 max-w-3xl">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 lg:space-y-6"
              >
                {renderContent(activeTab)}
              </motion.div>
            </main>
          </div>
        ) : (
          /* Mobile: Horizontal Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="-mx-3 px-3 mt-2 mb-6 overflow-x-auto scrollbar-none sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2">
              <TabsList className="inline-flex w-max min-w-full gap-1.5 h-auto p-1">
                <TabsTrigger value="profile" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Профиль</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Подписка</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">Статистика</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">Тема</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Приватность</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Bell className="w-4 h-4" />
                  <span className="text-xs">Уведомления</span>
                </TabsTrigger>
                <TabsTrigger value="hints" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-xs">Подсказки</span>
                </TabsTrigger>
                <TabsTrigger value="gestures" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <MousePointerClick className="w-4 h-4" />
                  <span className="text-xs">Жесты</span>
                </TabsTrigger>
                <TabsTrigger value="midi" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Music className="w-4 h-4" />
                  <span className="text-xs">MIDI</span>
                </TabsTrigger>
                <TabsTrigger value="telegram" className="gap-1.5 px-3 py-2 flex-shrink-0 min-h-11">
                  <Send className="w-4 h-4" />
                  <span className="text-xs">Telegram</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="space-y-5 mt-0">
              {renderContent("profile")}
            </TabsContent>
            <TabsContent value="subscription" className="space-y-5 mt-0">
              {renderContent("subscription")}
            </TabsContent>
            <TabsContent value="stats" className="space-y-5 mt-0">
              {renderContent("stats")}
            </TabsContent>
            <TabsContent value="appearance" className="space-y-5 mt-0">
              {renderContent("appearance")}
            </TabsContent>
            <TabsContent value="privacy" className="space-y-5 mt-0">
              {renderContent("privacy")}
            </TabsContent>
            <TabsContent value="notifications" className="space-y-5 mt-0">
              {renderContent("notifications")}
            </TabsContent>
            <TabsContent value="hints" className="space-y-5 mt-0">
              {renderContent("hints")}
            </TabsContent>
            <TabsContent value="gestures" className="space-y-5 mt-0">
              {renderContent("gestures")}
            </TabsContent>
            <TabsContent value="midi" className="space-y-5 mt-0">
              {renderContent("midi")}
            </TabsContent>
            <TabsContent value="telegram" className="space-y-5 mt-0">
              {renderContent("telegram")}
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <motion.div
          className="mt-10 lg:mt-8 text-center text-sm text-muted-foreground pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:gap-x-6">
            <Button
              variant="link"
              className="h-auto p-0 text-xs lg:text-base text-muted-foreground hover:text-primary transition-colors"
              onClick={() => settings.navigateTo("/terms")}
            >
              Условия использования
            </Button>
            <span className="opacity-50">•</span>
            <Button
              variant="link"
              className="h-auto p-0 text-xs lg:text-base text-muted-foreground hover:text-primary transition-colors"
              onClick={() => settings.navigateTo("/privacy")}
            >
              Конфиденциальность
            </Button>
            <span className="opacity-50">•</span>
            <Button
              variant="link"
              className="h-auto p-0 text-xs lg:text-base text-muted-foreground hover:text-primary transition-colors"
              onClick={() => settings.navigateTo("/connect")}
            >
              Подключить ассистента
            </Button>
          </div>
          <p className="mt-2 text-xs lg:text-sm">MusicVerse AI © 2025</p>
        </motion.div>
      </div>
    </div>
  );
}
