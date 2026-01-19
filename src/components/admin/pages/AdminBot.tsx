/**
 * Admin Telegram Bot Page
 * 
 * Telegram bot management with:
 * - Bot settings configuration
 * - Menu editor
 * - Message templates
 * - Webhook status
 * 
 * TODO: Add bot command editor
 * TODO: Add inline query analytics
 * TODO: Add bot user statistics
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bot, 
  Settings, 
  Menu, 
  Image,
  Activity,
} from 'lucide-react';

// Lazy load heavy components
const TelegramBotSettingsPanel = lazy(() => 
  import('../TelegramBotSettingsPanel').then(m => ({ default: m.TelegramBotSettingsPanel }))
);
const BotMenuEditor = lazy(() => 
  import('../BotMenuEditor').then(m => ({ default: m.BotMenuEditor }))
);
const AdminBotImagesPanel = lazy(() => 
  import('../AdminBotImagesPanel').then(m => ({ default: m.AdminBotImagesPanel }))
);
const HealthCheckPanel = lazy(() => 
  import('../HealthCheckPanel').then(m => ({ default: m.HealthCheckPanel }))
);

// ============================================================
// Tab Configuration
// ============================================================
const TABS = [
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'menu', label: 'Меню', icon: Menu },
  { id: 'images', label: 'Изображения', icon: Image },
  { id: 'health', label: 'Статус', icon: Activity },
] as const;

// ============================================================
// Loading Skeleton
// ============================================================
const BotSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <Card>
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

// ============================================================
// Main Component
// ============================================================
export function AdminBot() {
  const [activeTab, setActiveTab] = useState<string>('settings');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Telegram Бот
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Настройки бота, меню и изображения
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Suspense fallback={<BotSkeleton />}>
            <TelegramBotSettingsPanel />
          </Suspense>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="mt-4">
          <Suspense fallback={<BotSkeleton />}>
            <BotMenuEditor />
          </Suspense>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-4">
          <Suspense fallback={<BotSkeleton />}>
            <AdminBotImagesPanel />
          </Suspense>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-4">
          <Suspense fallback={<BotSkeleton />}>
            <HealthCheckPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* TODO: Add bot analytics */}
      {/* TODO: Add command usage stats */}
    </div>
  );
}

export default AdminBot;
