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
      style={settings.getContainerStyle(96)}
    >
      <div className={cn("container mx-auto px-4", isMobile ? "max-w-2xl" : "max-w-6xl")}>
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
            <TabsList
              className="grid w-full mb-6"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(55px, 1fr))" }}
            >
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
              <TabsTrigger value="gestures" className="gap-1 px-1">
                <MousePointerClick className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Жесты</span>
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

            <TabsContent value="profile" className="space-y-4">
              {renderContent("profile")}
            </TabsContent>
            <TabsContent value="subscription" className="space-y-4">
              {renderContent("subscription")}
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              {renderContent("stats")}
            </TabsContent>
            <TabsContent value="appearance" className="space-y-4">
              {renderContent("appearance")}
            </TabsContent>
            <TabsContent value="privacy" className="space-y-4">
              {renderContent("privacy")}
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              {renderContent("notifications")}
            </TabsContent>
            <TabsContent value="hints" className="space-y-4">
              {renderContent("hints")}
            </TabsContent>
            <TabsContent value="gestures" className="space-y-4">
              {renderContent("gestures")}
            </TabsContent>
            <TabsContent value="midi" className="space-y-4">
              {renderContent("midi")}
            </TabsContent>
            <TabsContent value="telegram" className="space-y-4">
              {renderContent("telegram")}
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <motion.div
          className="mt-6 lg:mt-8 text-center text-sm text-muted-foreground pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-4 lg:gap-6">
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors lg:text-base"
              onClick={() => settings.navigateTo("/terms")}
            >
              Условия использования
            </Button>
            <span>•</span>
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors lg:text-base"
              onClick={() => settings.navigateTo("/privacy")}
            >
              Конфиденциальность
            </Button>
            <span>•</span>
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors lg:text-base"
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
