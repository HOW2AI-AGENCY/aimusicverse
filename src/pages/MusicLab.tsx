/**
 * Music Lab Hub - Unified Creative Workspace
 * 
 * Consolidates all creative music tools:
 * - Quick Create (presets & 4-step flow)
 * - Drum Machine
 * - PromptDJ Mixer
 * - Chord Detection
 * - Tab Editor
 * - Guitar Studio (link)
 * 
 * Sprint 025: US-025-001 (Music Lab Hub)
 * Sprint 026: US-026-001 (Quick Create)
 * Sprint 026: US-026-003 (Workflow guide)
 */

import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MusicLabAudioProvider } from '@/contexts/MusicLabAudioContext';
import { toast } from 'sonner';
import { Zap, Drum, Disc3, Mic, ArrowLeft } from 'lucide-react';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

// Lazy load heavy components for better performance
const QuickCreate = lazy(() => import('@/components/music-lab/QuickCreate').then(m => ({ default: m.QuickCreate })));
const DrumMachineClean = lazy(() => import('@/components/drum-machine/pro').then(m => ({ default: m.DrumMachineClean })));
const PromptDJMixer = lazy(() => import('@/components/prompt-dj').then(m => ({ default: m.PromptDJMixer })));
const RealtimeChordVisualizer = lazy(() => import('@/components/chord-detection/RealtimeChordVisualizer').then(m => ({ default: m.RealtimeChordVisualizer })));

// Loading skeleton for lazy components
function TabLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function MusicLab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quick-create');

  // Telegram BackButton
  const { shouldShowUIButton } = useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  const handleProgressionExport = (progression: string) => {
    toast.success('Прогрессия скопирована', { description: progression });
  };

  const tabs = [
    { id: 'quick-create', label: 'Quick', icon: Zap },
    { id: 'drums', label: 'Drums', icon: Drum },
    { id: 'promptdj', label: 'DJ', icon: Disc3 },
    { id: 'chords', label: 'Chords', icon: Mic },
  ];

  return (
    <MusicLabAudioProvider>
      <div className="min-h-screen bg-background pb-20">
        <div className="container max-w-4xl mx-auto px-3 py-4">
          {/* Compact Header */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Music Lab</h1>
          </div>

          {/* Main Tabs - Cleaner */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full mb-4">
              {tabs.slice(0, 4).map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1 text-xs">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Quick Create */}
            <TabsContent value="quick-create" className="mt-0">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <QuickCreate />
              </Suspense>
            </TabsContent>

            {/* Drum Machine */}
            <TabsContent value="drums" className="mt-0">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <DrumMachineClean />
              </Suspense>
            </TabsContent>

            {/* PromptDJ Mixer */}
            <TabsContent value="promptdj" className="mt-0">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <PromptDJMixer />
              </Suspense>
            </TabsContent>

            {/* Chord Detection */}
            <TabsContent value="chords" className="mt-0">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <RealtimeChordVisualizer onProgressionExport={handleProgressionExport} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MusicLabAudioProvider>
  );
}
