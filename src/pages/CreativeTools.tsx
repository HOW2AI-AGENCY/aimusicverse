/**
 * CreativeTools - Page combining all creative music tools
 * Drums, PromptDJ, Chord Detection, Tab Editor
 * Desktop: Two-column layout with tabs + content side by side
 */

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { useNavigate } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProBadge } from "@/components/ui/pro-badge";
import { ArrowLeft, Mic, Guitar, Music, Zap, FileMusic, Sparkles, Drum, Disc3 } from "@/lib/icons";
import { RealtimeChordVisualizer } from "@/components/chord-detection/RealtimeChordVisualizer";
import { GuitarTabEditor } from "@/components/tab-editor/GuitarTabEditor";
import { DrumMachineClean } from "@/components/drum-machine/pro";
import { PromptDJMixer } from "@/components/prompt-dj";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const tools = [
  { id: "drums", label: "Драм машина", icon: Drum, description: "Создавайте ритмы и паттерны" },
  { id: "promptdj", label: "DJ Mixer", icon: Disc3, description: "Микшируйте промпты для генерации" },
  { id: "chords", label: "Аккорды", icon: Mic, description: "Распознавание аккордов в реальном времени" },
  { id: "tabs", label: "Табулатуры", icon: Guitar, description: "Редактор гитарных табов" },
];

export default function CreativeTools() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("drums");

  const handleProgressionExport = (progression: string) => {
    toast.success("Прогрессия скопирована", {
      description: progression,
    });
  };

  const handleTabExport = (format: "midi" | "gp5" | "pdf") => {
    toast.info(`Экспорт в ${format.toUpperCase()}...`, {
      description: "Эта функция будет доступна в следующем обновлении",
    });
  };

  const renderToolContent = (toolId: string) => {
    switch (toolId) {
      case "drums":
        return <DrumMachineClean />;
      case "promptdj":
        return <PromptDJMixer />;
      case "chords":
        return (
          <>
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
            <RealtimeChordVisualizer onProgressionExport={handleProgressionExport} />
          </>
        );
      case "tabs":
        return (
          <>
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
            <GuitarTabEditor onExport={handleTabExport} />
          </>
        );
      default:
        return null;
    }
  };

  // Desktop layout: sidebar with tool list + main content area
  const renderDesktopLayout = () => (
    <div className="flex gap-6 min-h-[calc(100vh-200px)]">
      {/* Tool Selector Sidebar */}
      <div className="w-64 shrink-0 space-y-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;
          return (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all",
                "border border-border/50 hover:border-primary/30",
                isActive ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20" : "bg-card/50 hover:bg-card",
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", isActive ? "bg-primary/20" : "bg-muted")}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("font-medium", isActive && "text-primary")}>{tool.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Guitar Studio Link */}
        <Button
          variant="outline"
          className="w-full h-auto py-4 justify-start bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20 hover:from-orange-500/10 hover:to-red-500/10 mt-4"
          onClick={() => navigate("/guitar-studio")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Guitar Studio</span>
                <ProBadge size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">Профессиональная запись</p>
            </div>
          </div>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderToolContent(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // Mobile layout: tabs at top
  const renderMobileLayout = () => (
    <>
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
            <TabsContent value="drums" className="mt-0">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <DrumMachineClean />
              </motion.div>
            </TabsContent>

            <TabsContent value="promptdj" className="mt-0">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <PromptDJMixer />
              </motion.div>
            </TabsContent>

            <TabsContent value="chords" className="mt-0">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                {renderToolContent("chords")}
              </motion.div>
            </TabsContent>

            <TabsContent value="tabs" className="mt-0">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                {renderToolContent("tabs")}
              </motion.div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Quick Access to Guitar Studio - Mobile */}
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
          onClick={() => navigate("/guitar-studio")}
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
    </>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24"
      style={{
        paddingTop:
          "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
      }}
    >
      <div className={cn("container mx-auto px-4 py-4", isMobile ? "max-w-4xl" : "max-w-7xl")}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
                <p className="text-sm text-muted-foreground">Создавайте музыкальные идеи и конвертируйте в треки</p>
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

        {/* Responsive Layout */}
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </div>
    </div>
  );
}
