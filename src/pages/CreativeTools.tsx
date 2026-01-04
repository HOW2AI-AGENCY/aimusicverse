/**
 * CreativeTools - Page combining all creative music tools
 * Drums, PromptDJ, Chord Detection, Tab Editor
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProBadge } from '@/components/ui/pro-badge';
import { ArrowLeft, Mic, Guitar, Music, Zap, FileMusic, Sparkles, Drum, Disc3 } from 'lucide-react';
import { RealtimeChordVisualizer } from '@/components/chord-detection/RealtimeChordVisualizer';
import { GuitarTabEditor } from '@/components/tab-editor/GuitarTabEditor';
import { DrumMachineClean } from '@/components/drum-machine/pro';
import { PromptDJMixer } from '@/components/prompt-dj';
import { toast } from 'sonner';

export default function CreativeTools() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('drums');

  const handleProgressionExport = (progression: string) => {
    toast.success('Прогрессия скопирована', {
      description: progression,
    });
  };

  const handleTabExport = (format: 'midi' | 'gp5' | 'pdf') => {
    toast.info(`Экспорт в ${format.toUpperCase()}...`, {
      description: 'Эта функция будет доступна в следующем обновлении',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
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
                  <h1 className="text-2xl font-bold">Креативные инструменты</h1>
                  <ProBadge size="md" showIcon />
                </div>
                <p className="text-sm text-muted-foreground">
                  Создавайте музыкальные идеи и конвертируйте в треки
                </p>
              </div>
            </div>
          </div>

          {/* Professional Features Info */}
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

        {/* Tabs - 4 tools */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="drums" className="gap-1.5">
              <Drum className="h-4 w-4" />
              <span className="hidden sm:inline">Драм</span>
            </TabsTrigger>
            <TabsTrigger value="promptdj" className="gap-1.5">
              <Disc3 className="h-4 w-4" />
              <span className="hidden sm:inline">DJ Mixer</span>
            </TabsTrigger>
            <TabsTrigger value="chords" className="gap-1.5">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Аккорды</span>
            </TabsTrigger>
            <TabsTrigger value="tabs" className="gap-1.5">
              <Guitar className="h-4 w-4" />
              <span className="hidden sm:inline">Табы</span>
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
              {/* Drum Machine */}
              <TabsContent value="drums" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <DrumMachineClean />
                </motion.div>
              </TabsContent>

              {/* PromptDJ */}
              <TabsContent value="promptdj" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <PromptDJMixer />
                </motion.div>
              </TabsContent>

              {/* Chord Detection */}
              <TabsContent value="chords" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
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
                  <RealtimeChordVisualizer
                    onProgressionExport={handleProgressionExport}
                  />
                </motion.div>
              </TabsContent>

              {/* Tab Editor */}
              <TabsContent value="tabs" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
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
                  <GuitarTabEditor
                    onExport={handleTabExport}
                  />
                </motion.div>
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
              <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
