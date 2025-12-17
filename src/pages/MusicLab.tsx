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

import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProBadge } from '@/components/ui/pro-badge';
import { MusicLabAudioProvider } from '@/contexts/MusicLabAudioContext';
import { WorkflowGuide } from '@/components/workflows/WorkflowGuide';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { 
  Zap, Drum, Disc3, Mic, Guitar, Music, FileMusic, 
  Sparkles, ArrowLeft, ChevronRight 
} from 'lucide-react';

// Lazy load heavy components for better performance
const QuickCreate = lazy(() => import('@/components/music-lab/QuickCreate').then(m => ({ default: m.QuickCreate })));
const DrumMachineClean = lazy(() => import('@/components/drum-machine/pro').then(m => ({ default: m.DrumMachineClean })));
const PromptDJMixer = lazy(() => import('@/components/prompt-dj').then(m => ({ default: m.PromptDJMixer })));
const RealtimeChordVisualizer = lazy(() => import('@/components/chord-detection/RealtimeChordVisualizer').then(m => ({ default: m.RealtimeChordVisualizer })));
const GuitarTabEditor = lazy(() => import('@/components/tab-editor/GuitarTabEditor').then(m => ({ default: m.GuitarTabEditor })));

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
  const [showWorkflow, setShowWorkflow] = useState(false);

  useEffect(() => {
    const hasActiveWorkflow = WorkflowEngine.isActive();
    setShowWorkflow(hasActiveWorkflow);

    // Auto-start workflow for first-time guitar users
    if (activeTab === 'chords' && !hasActiveWorkflow) {
      const hasSeenGuitarWorkflow = localStorage.getItem('hasSeenGuitarWorkflow');
      if (!hasSeenGuitarWorkflow) {
        WorkflowEngine.startWorkflow('guitar-to-full');
        setShowWorkflow(true);
        localStorage.setItem('hasSeenGuitarWorkflow', 'true');
        logger.info('Started guitar-to-full workflow for first-time user');
      }
    }
  }, [activeTab]);

  const handleProgressionExport = (progression: string) => {
    toast.success('Прогрессия скопирована', { description: progression });
  };

  const handleTabExport = (format: 'midi' | 'gp5' | 'pdf') => {
    toast.info(`Экспорт в ${format.toUpperCase()}...`, {
      description: 'Эта функция будет доступна в следующем обновлении',
    });
  };

  const tabs = [
    { id: 'quick-create', label: 'Quick', fullLabel: 'Quick Create', icon: Zap },
    { id: 'drums', label: 'Драм', fullLabel: 'Драм машина', icon: Drum },
    { id: 'promptdj', label: 'DJ', fullLabel: 'DJ Mixer', icon: Disc3 },
    { id: 'chords', label: 'Аккорды', fullLabel: 'Распознавание', icon: Mic },
    { id: 'tabs', label: 'Табы', fullLabel: 'Редактор табов', icon: Guitar },
  ];

  return (
    <MusicLabAudioProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20">
                  <Music className="h-6 w-6 text-pink-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">Music Lab</h1>
                    <ProBadge size="md" showIcon />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unified workspace для создания музыки
                  </p>
                </div>
              </div>
            </div>

            {/* Features Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5 border border-primary/10"
            >
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-pink-400" />
                <span className="text-muted-foreground">Real-time обработка</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <FileMusic className="w-4 h-4 text-purple-400" />
                <span className="text-muted-foreground">Экспорт в MIDI/GP5</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-muted-foreground">AI-генерация</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Workflow Guide */}
          {showWorkflow && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <WorkflowGuide onDismiss={() => setShowWorkflow(false)} />
            </motion.div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span className="sm:hidden">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                  <div className="mb-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Распознавание аккордов</h2>
                      </div>
                      <ProBadge size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Играйте аккорды на гитаре — приложение распознает их в реальном времени
                    </p>
                  </div>
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <RealtimeChordVisualizer onProgressionExport={handleProgressionExport} />
                  </Suspense>
                </TabsContent>

                {/* Tab Editor */}
                <TabsContent value="tabs" className="mt-0">
                  <div className="mb-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Guitar className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Редактор табулатур</h2>
                      </div>
                      <ProBadge size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Создавайте и редактируйте гитарные табулатуры с экспортом в MIDI и GP5
                    </p>
                  </div>
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <GuitarTabEditor onExport={handleTabExport} />
                  </Suspense>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          {/* Quick Access to Guitar Studio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full h-auto py-6 justify-start bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20 hover:from-orange-500/10 hover:to-red-500/10"
              onClick={() => navigate('/guitar-studio')}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-base">Guitar Studio</div>
                    <ProBadge size="sm" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Профессиональная запись, анализ и транскрипция гитары через klang.io
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Button>
          </motion.div>

          {/* Quick Actions Footer */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="p-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate('/generate')}
            >
              <h3 className="font-semibold mb-2">🚀 Генерация</h3>
              <p className="text-sm text-muted-foreground">
                Создать трек из идеи
              </p>
            </Card>
            <Card 
              className="p-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate('/projects')}
            >
              <h3 className="font-semibold mb-2">📁 Проекты</h3>
              <p className="text-sm text-muted-foreground">
                Альбомы и коллекции
              </p>
            </Card>
            <Card 
              className="p-4 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate('/library')}
            >
              <h3 className="font-semibold mb-2">📚 Библиотека</h3>
              <p className="text-sm text-muted-foreground">
                Ваши треки
              </p>
            </Card>
          </div>
        </div>
      </div>
    </MusicLabAudioProvider>
  );
}
