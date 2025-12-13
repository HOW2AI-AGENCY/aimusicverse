// ActivityPage - Sprint 011 Phase 7
// Activity feed page with filter tabs

import { ActivityFeed } from '@/components/social/ActivityFeed';
import { Activity } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Лента активности</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Смотрите, что делают пользователи, на которых вы подписаны
          </p>
        </div>
      </header>

      {/* Activity Feed */}
      <div className="flex-1 overflow-hidden">
        <ActivityFeed />
      </div>
    </div>
  );
}
