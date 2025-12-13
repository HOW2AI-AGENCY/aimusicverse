// ActivityPage Component - Sprint 011 Task T075
// Activity feed page with filter tabs

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { Activity, Music, Heart, ListMusic } from 'lucide-react';
import type { ActivityType } from '@/types/activity';

/**
 * Activity page with feed and filter tabs
 */
export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'all' | ActivityType>('all');

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Активность</h1>
        </div>
        <p className="text-muted-foreground">
          Следите за активностью создателей, на которых вы подписаны
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | ActivityType)}
        className="space-y-6"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Все</span>
          </TabsTrigger>
          <TabsTrigger value="track_published" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            <span>Треки</span>
          </TabsTrigger>
          <TabsTrigger value="track_liked" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span>Лайки</span>
          </TabsTrigger>
          <TabsTrigger value="playlist_created" className="flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            <span>Плейлисты</span>
          </TabsTrigger>
        </TabsList>

        {/* All Activities */}
        <TabsContent value="all" className="mt-0 min-h-[400px]">
          <ActivityFeed />
        </TabsContent>

        {/* Tracks Only */}
        <TabsContent value="track_published" className="mt-0 min-h-[400px]">
          <ActivityFeed activityType="track_published" />
        </TabsContent>

        {/* Likes Only */}
        <TabsContent value="track_liked" className="mt-0 min-h-[400px]">
          <ActivityFeed activityType="track_liked" />
        </TabsContent>

        {/* Playlists Only */}
        <TabsContent value="playlist_created" className="mt-0 min-h-[400px]">
          <ActivityFeed activityType="playlist_created" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
