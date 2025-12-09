/**
 * CreativeTools - Page combining all creative music tools
 * Chord Detection, Tab Editor, Melody Mixer
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Guitar, Sparkles, Music } from 'lucide-react';
import { RealtimeChordVisualizer } from '@/components/chord-detection/RealtimeChordVisualizer';
import { GuitarTabEditor } from '@/components/tab-editor/GuitarTabEditor';
import { MelodyMixer } from '@/components/melody-mixer/MelodyMixer';
import { toast } from 'sonner';

export default function CreativeTools() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chords');

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

  const handleUseAsReference = (audioUrl: string, prompt: string) => {
    // Navigate to generation with audio reference
    navigate('/generate', {
      state: {
        audioReferenceUrl: audioUrl,
        prefilledPrompt: prompt,
        mode: 'custom',
      },
    });
    toast.success('Переход к генерации...', {
      description: 'Мелодия будет использована как референс',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Креативные инструменты</h1>
              <p className="text-sm text-muted-foreground">
                Создавайте музыкальные идеи
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="chords" className="gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Аккорды</span>
            </TabsTrigger>
            <TabsTrigger value="tabs" className="gap-2">
              <Guitar className="h-4 w-4" />
              <span className="hidden sm:inline">Табулатура</span>
            </TabsTrigger>
            <TabsTrigger value="mixer" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Миксер</span>
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
              {/* Chord Detection */}
              <TabsContent value="chords" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="mb-4 p-4 bg-muted/30 rounded-xl">
                    <h2 className="font-semibold mb-1 flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      Распознавание аккордов
                    </h2>
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
                  <div className="mb-4 p-4 bg-muted/30 rounded-xl">
                    <h2 className="font-semibold mb-1 flex items-center gap-2">
                      <Guitar className="h-5 w-5 text-primary" />
                      Редактор табулатур
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Создавайте и редактируйте гитарные табулатуры с экспортом в MIDI и GP5
                    </p>
                  </div>
                  <GuitarTabEditor
                    onExport={handleTabExport}
                  />
                </motion.div>
              </TabsContent>

              {/* Melody Mixer */}
              <TabsContent value="mixer" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="mb-4 p-4 bg-muted/30 rounded-xl">
                    <h2 className="font-semibold mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Melody Mixer
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Смешивайте музыкальные стили и записывайте мелодии для генерации
                    </p>
                  </div>
                  <MelodyMixer
                    onUseAsReference={handleUseAsReference}
                  />
                </motion.div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
