/**
 * ProfessionalStudio - Dedicated page for professional musicians
 * Central hub for all professional workflows and tools
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Music, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ProfessionalDashboard,
  WorkflowVisualizer, 
  workflowPresets,
  PresetsManager,
  Preset,
  QuickAccessPanel,
  StatsWidget,
  TipsPanel,
} from '@/components/professional';
import { toast } from 'sonner';

// Mock data for demonstration
const mockPresets: Preset[] = [
  {
    id: '1',
    name: 'Rock Master',
    description: 'Мощное звучание для рок-музыки',
    category: 'mix',
    icon: Music,
    color: 'from-red-500 to-orange-500',
    isFavorite: true,
    isBuiltIn: true,
    settings: { eq: 'bright', compression: 'heavy', reverb: 'room' },
    tags: ['Rock', 'Heavy', 'Live'],
    createdAt: '2 дня назад',
    usageCount: 45,
  },
  {
    id: '2',
    name: 'Pop Clarity',
    description: 'Чистое и прозрачное звучание',
    category: 'eq',
    icon: Sparkles,
    color: 'from-pink-500 to-purple-500',
    isFavorite: false,
    isBuiltIn: true,
    settings: { eq: 'transparent', compression: 'gentle', reverb: 'hall' },
    tags: ['Pop', 'Clean', 'Radio'],
    createdAt: '1 неделю назад',
    usageCount: 32,
  },
  {
    id: '3',
    name: 'Electronic Energy',
    description: 'Мощные басы и яркие высокие',
    category: 'compressor',
    icon: Download,
    color: 'from-cyan-500 to-blue-500',
    isFavorite: true,
    isBuiltIn: true,
    settings: { eq: 'enhanced', compression: 'moderate', reverb: 'plate' },
    tags: ['EDM', 'Bass', 'Club'],
    createdAt: '3 дня назад',
    usageCount: 28,
  },
];

export default function ProfessionalStudio() {
  const navigate = useNavigate();
  const [presets] = useState<Preset[]>(mockPresets);
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleApplyPreset = (preset: Preset) => {
    console.log('Applying preset:', preset);
  };

  const handleSavePreset = (name: string, settings: Record<string, unknown>) => {
    console.log('Saving preset:', name, settings);
  };

  const handleDeletePreset = (presetId: string) => {
    console.log('Deleting preset:', presetId);
    toast.success('Пресет удалён');
  };

  const handleToggleFavorite = (presetId: string) => {
    console.log('Toggling favorite:', presetId);
    toast.success('Избранное обновлено');
  };

  const handleExportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'musicverse-presets.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Пресеты экспортированы');
  };

  const handleImportPresets = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        console.log('Imported presets:', imported);
        toast.success(`Импортировано ${imported.length} пресетов`);
      } catch (error) {
        toast.error('Ошибка импорта');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
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
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/20">
                <Music className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  Профессиональная студия
                  <Sparkles className="w-6 h-6 text-primary" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Полный набор инструментов для профессиональной работы
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  Добро пожаловать в профессиональную студию
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Здесь вы найдёте все инструменты для создания, обработки и экспорта музыки: 
                  от генерации треков до профессионального микширования и конвертации в MIDI.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
                <Music className="w-4 h-4 mr-2" />
                Дашборд
              </TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Воркфлоу
              </TabsTrigger>
              <TabsTrigger value="presets" className="text-xs sm:text-sm">
                <Save className="w-4 h-4 mr-2" />
                Пресеты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                  <StatsWidget variant="grid" showTrend={true} animated={true} />
                  <ProfessionalDashboard />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <QuickAccessPanel variant="expanded" showProgress={true} maxActions={5} />
                  <TipsPanel context="general" variant="carousel" dismissible={false} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Активные воркфлоу</h2>
                
                {/* Music Creation Workflow */}
                <WorkflowVisualizer
                  title={workflowPresets.musicCreation.title}
                  steps={workflowPresets.musicCreation.steps}
                  currentStep={1}
                  totalProgress={50}
                  variant="horizontal"
                  showTimeline={true}
                />

                {/* MIDI Workflow */}
                <WorkflowVisualizer
                  title={workflowPresets.midiWorkflow.title}
                  steps={workflowPresets.midiWorkflow.steps}
                  currentStep={1}
                  totalProgress={25}
                  variant="horizontal"
                  showTimeline={true}
                />
              </div>

              {/* Tips Section */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      💡 Советы по работе с воркфлоу
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Используйте визуализацию для отслеживания прогресса</li>
                      <li>• Сохраняйте пресеты на каждом этапе для быстрого доступа</li>
                      <li>• Экспериментируйте с разными последовательностями</li>
                      <li>• Комбинируйте профессиональные инструменты для лучшего результата</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="mt-0">
              <PresetsManager
                presets={presets}
                onApplyPreset={handleApplyPreset}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
                onToggleFavorite={handleToggleFavorite}
                onExportPresets={handleExportPresets}
                onImportPresets={handleImportPresets}
                currentSettings={{ eq: 'flat', compression: 'off', reverb: 'none' }}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Quick Access Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate('/guitar-studio')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Guitar Studio</div>
                <div className="text-xs text-muted-foreground">
                  Запись и транскрипция
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate('/creative-tools')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Creative Tools</div>
                <div className="text-xs text-muted-foreground">
                  Chord Detection, Tab Editor
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate('/library')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Библиотека</div>
                <div className="text-xs text-muted-foreground">
                  Ваши треки и стемы
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate('/generate')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Генерация</div>
                <div className="text-xs text-muted-foreground">
                  Создать новый трек
                </div>
              </div>
            </div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
