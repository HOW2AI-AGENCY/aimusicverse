/**
 * AudioHub - Centralized audio recording, upload, and analysis dashboard
 * 
 * Features:
 * - Quick recording with mode selection (vocal/guitar/instrument)
 * - File upload with drag & drop
 * - Batch analysis of uploaded audio
 * - Recent recordings and uploads history
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Mic, Upload, AudioWaveform, Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopToolsGridLayout } from '@/components/layout/desktop';

// Hub sections
import { AudioHubRecorder } from '@/components/audio-hub/AudioHubRecorder';
import { AudioHubUploader } from '@/components/audio-hub/AudioHubUploader';
import { AudioHubHistory } from '@/components/audio-hub/AudioHubHistory';
import { AudioHubQuickActions } from '@/components/audio-hub/AudioHubQuickActions';

type HubTab = 'record' | 'upload' | 'history';

const AudioHub = memo(function AudioHub() {
  const [activeTab, setActiveTab] = useState<HubTab>('record');
  const isMobile = useIsMobile();

  // Header component
  const Header = (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10">
        <AudioWaveform className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Audio Hub</h1>
        <p className="text-sm text-muted-foreground">
          Запись, загрузка и анализ аудио
        </p>
      </div>
    </div>
  );

  // Desktop layout - side-by-side panels
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            {Header}
          </div>
        </div>

        <DesktopToolsGridLayout
          maxWidth="wide"
          quickActions={<AudioHubQuickActions />}
          gridType="dashboard"
        >
          {/* Left column - Record & Upload */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Запись
              </h2>
              <AudioHubRecorder />
            </div>
            
            <div className="p-6 rounded-xl border bg-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Загрузка
              </h2>
              <AudioHubUploader />
            </div>
          </div>

          {/* Right column - History */}
          <div className="p-6 rounded-xl border bg-card h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              История
            </h2>
            <AudioHubHistory />
          </div>
        </DesktopToolsGridLayout>
      </div>
    );
  }

  // Mobile layout - tabs
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          {Header}
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <AudioHubQuickActions />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HubTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record" className="gap-2">
              <Mic className="h-4 w-4" />
              Запись
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              История
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="record" className="mt-4">
                <AudioHubRecorder />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <AudioHubUploader />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <AudioHubHistory />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
});

export default AudioHub;