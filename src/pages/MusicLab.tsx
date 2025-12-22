/**
 * Music Lab Hub - Unified Creative Workspace
 * 
 * Tabs: Вокал, Гитара, Лирика+AI, PromptDJ (PRO), Аккорды
 */

import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MusicLabAudioProvider } from '@/contexts/MusicLabAudioContext';
import { toast } from 'sonner';
import { Mic, Guitar, PenLine, Disc3, Music, ArrowLeft, Crown } from 'lucide-react';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { FeatureGate, PremiumBadge } from '@/components/premium';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// Lazy load heavy components
const AudioRecordDialog = lazy(() => import('@/components/audio-record/AudioRecordDialog').then(m => ({ default: m.AudioRecordDialog })));
const GuitarRecordDialog = lazy(() => import('@/components/generate-form/GuitarRecordDialog').then(m => ({ default: m.GuitarRecordDialog })));
const LyricsAIChatAgent = lazy(() => import('@/components/lyrics-workspace/LyricsAIChatAgent').then(m => ({ default: m.LyricsAIChatAgent })));
const PromptDJMixer = lazy(() => import('@/components/prompt-dj').then(m => ({ default: m.PromptDJMixer })));
const RealtimeChordVisualizer = lazy(() => import('@/components/chord-detection/RealtimeChordVisualizer').then(m => ({ default: m.RealtimeChordVisualizer })));

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
  const [activeTab, setActiveTab] = useState('vocal');
  const [vocalDialogOpen, setVocalDialogOpen] = useState(false);
  const [guitarDialogOpen, setGuitarDialogOpen] = useState(false);
  
  const { hasAccess: hasPromptDJ } = useFeatureAccess('prompt_dj');
  const { hasAccess: hasGuitarStudio } = useFeatureAccess('guitar_studio');

  useTelegramBackButton({ visible: true, fallbackPath: '/' });

  const handleProgressionExport = (progression: string) => {
    toast.success('Прогрессия скопирована', { description: progression });
  };

  return (
    <MusicLabAudioProvider>
      <div className="min-h-screen bg-background pb-20">
        <div className="container max-w-4xl mx-auto px-3 py-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Music Lab</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full mb-4">
              <TabsTrigger value="vocal" className="gap-1 text-xs px-1">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Вокал</span>
              </TabsTrigger>
              <TabsTrigger value="guitar" className="gap-1 text-xs px-1 relative">
                <Guitar className="h-4 w-4" />
                <span className="hidden sm:inline">Гитара</span>
                {!hasGuitarStudio && <PremiumBadge tier="BASIC" className="absolute -top-1 -right-1 scale-75" />}
              </TabsTrigger>
              <TabsTrigger value="lyrics" className="gap-1 text-xs px-1">
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">Лирика</span>
              </TabsTrigger>
              <TabsTrigger value="promptdj" className="gap-1 text-xs px-1 relative">
                <Disc3 className="h-4 w-4" />
                <span className="hidden sm:inline">DJ</span>
                {!hasPromptDJ && <PremiumBadge tier="PRO" className="absolute -top-1 -right-1 scale-75" />}
              </TabsTrigger>
              <TabsTrigger value="chords" className="gap-1 text-xs px-1">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Аккорды</span>
              </TabsTrigger>
            </TabsList>

            {/* Vocal Recording */}
            <TabsContent value="vocal" className="mt-0">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-lg font-semibold mb-2">Запись вокала</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Запишите вокал или загрузите аудио для обработки
                  </p>
                  <Button onClick={() => setVocalDialogOpen(true)}>
                    <Mic className="w-4 h-4 mr-2" />
                    Начать запись
                  </Button>
                </div>
                <Suspense fallback={<TabLoadingSkeleton />}>
                  <AudioRecordDialog open={vocalDialogOpen} onOpenChange={setVocalDialogOpen} />
                </Suspense>
              </div>
            </TabsContent>

            {/* Guitar Studio */}
            <TabsContent value="guitar" className="mt-0">
              <FeatureGate feature="guitar_studio">
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Guitar className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h2 className="text-lg font-semibold mb-2">Guitar Studio</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Запишите гитару и получите анализ, аккорды и MIDI
                    </p>
                    <Button onClick={() => setGuitarDialogOpen(true)}>
                      <Guitar className="w-4 h-4 mr-2" />
                      Записать гитару
                    </Button>
                  </div>
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <GuitarRecordDialog open={guitarDialogOpen} onOpenChange={setGuitarDialogOpen} />
                  </Suspense>
                </div>
              </FeatureGate>
            </TabsContent>

            {/* Lyrics + AI Agent */}
            <TabsContent value="lyrics" className="mt-0">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <LyricsAIChatAgent 
                  existingLyrics=""
                  globalTags={[]}
                  stylePrompt=""
                  title=""
                />
              </Suspense>
            </TabsContent>

            {/* PromptDJ Mixer */}
            <TabsContent value="promptdj" className="mt-0">
              <FeatureGate feature="prompt_dj">
                <Suspense fallback={<TabLoadingSkeleton />}>
                  <PromptDJMixer />
                </Suspense>
              </FeatureGate>
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
