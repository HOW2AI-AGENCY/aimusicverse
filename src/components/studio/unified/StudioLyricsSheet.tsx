/**
 * StudioLyricsSheet - Full-featured lyrics studio sheet for StudioShell
 * 
 * Provides comprehensive lyrics editing with:
 * - Section-based editing with type indicators
 * - Version history with restore
 * - Section notes management
 * - AI tools toolbar
 * - Statistics and validation
 */

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  FileText,
  History,
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
  X,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  PenTool,
  ArrowRight,
  Repeat,
  BarChart2,
  Mic2,
  Layers,
  Zap,
  Palette,
  Languages,
  AlertCircle,
  Plus,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { useLyricsStudio, AI_TOOLS, type LyricsSection, type LyricsVersion, type SectionNote } from '@/hooks/lyrics/useLyricsStudio';

// ============================================================================
// TYPES
// ============================================================================

interface StudioLyricsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trackId?: string;
  projectTrackId?: string;
  lyricsTemplateId?: string;
  initialLyrics?: string;
  onLyricsSaved?: (lyrics: string) => void;
}

type ViewMode = 'editor' | 'history' | 'notes' | 'ai';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SECTION_COLORS: Record<string, string> = {
  verse: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  chorus: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  prechorus: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  bridge: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  hook: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  intro: 'bg-green-500/20 text-green-500 border-green-500/30',
  outro: 'bg-red-500/20 text-red-500 border-red-500/30',
  breakdown: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};

const AI_TOOL_ICONS: Record<string, React.ReactNode> = {
  write: <PenTool className="w-4 h-4" />,
  continue: <ArrowRight className="w-4 h-4" />,
  rhyme: <Repeat className="w-4 h-4" />,
  analyze: <BarChart2 className="w-4 h-4" />,
  producer: <Mic2 className="w-4 h-4" />,
  structure: <Layers className="w-4 h-4" />,
  optimize: <Zap className="w-4 h-4" />,
  style: <Palette className="w-4 h-4" />,
  translate: <Languages className="w-4 h-4" />,
};

// Stats bar component
const StatsBar = memo(function StatsBar({
  stats,
  isDirty,
}: {
  stats: { wordCount: number; lineCount: number; sectionCount: number; versionsCount: number };
  isDirty: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
      <span>{stats.wordCount} слов</span>
      <span className="text-border">•</span>
      <span>{stats.lineCount} строк</span>
      <span className="text-border">•</span>
      <span>{stats.sectionCount} секций</span>
      {stats.versionsCount > 0 && (
        <>
          <span className="text-border">•</span>
          <span>{stats.versionsCount} версий</span>
        </>
      )}
      {isDirty && (
        <Badge variant="outline" className="ml-auto h-5 text-[10px] text-amber-500 border-amber-500/30">
          Не сохранено
        </Badge>
      )}
    </div>
  );
});

// Section markers component
const SectionMarkers = memo(function SectionMarkers({
  sections,
  onSectionClick,
}: {
  sections: LyricsSection[];
  onSectionClick: (section: LyricsSection) => void;
}) {
  const { patterns } = useHaptic();

  if (sections.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b bg-muted/20">
      <p className="text-xs text-muted-foreground mb-2">Структура:</p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => {
              patterns.tap();
              onSectionClick(section);
            }}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium border transition-all active:scale-95",
              SECTION_COLORS[section.type] || 'bg-muted text-muted-foreground border-border'
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// AI Tools toolbar
const AIToolsToolbar = memo(function AIToolsToolbar({
  activeToolId,
  onToolSelect,
  onClose,
}: {
  activeToolId: string | null;
  onToolSelect: (toolId: string) => void;
  onClose: () => void;
}) {
  const { patterns } = useHaptic();
  const categories = ['create', 'analyze', 'optimize'] as const;
  const categoryLabels = { create: 'Создание', analyze: 'Анализ', optimize: 'Оптимизация' };

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category}>
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
            {categoryLabels[category]}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AI_TOOLS.filter(t => t.category === category).map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  patterns.select();
                  onToolSelect(tool.id);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border",
                  "hover:bg-accent active:scale-95",
                  activeToolId === tool.id
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/50"
                )}
              >
                {AI_TOOL_ICONS[tool.id]}
                <span className="text-xs font-medium">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Placeholder for active tool UI */}
      {activeToolId && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {AI_TOOL_ICONS[activeToolId]}
              <span className="font-medium">
                {AI_TOOLS.find(t => t.id === activeToolId)?.name}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {AI_TOOLS.find(t => t.id === activeToolId)?.description}
          </p>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span className="text-sm">AI-ассистент загружается...</span>
          </div>
        </Card>
      )}
    </div>
  );
});

// Version history view
const VersionHistoryView = memo(function VersionHistoryView({
  versions,
  onRestore,
  isRestoring,
}: {
  versions: LyricsVersion[];
  onRestore: (versionId: string) => void;
  isRestoring: boolean;
}) {
  const { patterns } = useHaptic();

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">История версий пуста</p>
        <p className="text-xs text-muted-foreground mt-1">
          Сохраните текст, чтобы создать первую версию
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <motion.div
          key={version.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-card rounded-lg border"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                version.isCurrent ? "bg-primary/20" : "bg-muted"
              )}>
                {version.isCurrent ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <History className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Версия {version.versionNumber}</span>
                  {version.isCurrent && (
                    <Badge variant="outline" className="h-5 text-[10px]">Текущая</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {!version.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  patterns.select();
                  onRestore(version.id);
                }}
                disabled={isRestoring}
                className="h-8 px-2"
              >
                {isRestoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Восстановить
                  </>
                )}
              </Button>
            )}
          </div>
          {version.changeDescription && (
            <p className="text-xs text-muted-foreground mb-2">{version.changeDescription}</p>
          )}
          <div className="bg-muted/50 rounded p-2.5 max-h-24 overflow-y-auto">
            <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
              {version.lyrics.slice(0, 200)}...
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// Section notes view
const SectionNotesView = memo(function SectionNotesView({
  notes,
  sections,
  onAddNote,
  onDeleteNote,
}: {
  notes: SectionNote[];
  sections: LyricsSection[];
  onAddNote: (sectionId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  const { patterns } = useHaptic();
  const [newNoteSection, setNewNoteSection] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = useCallback(() => {
    if (!newNoteSection || !newNoteContent.trim()) return;
    patterns.success();
    onAddNote(newNoteSection, newNoteContent);
    setNewNoteContent('');
    setNewNoteSection(null);
  }, [newNoteSection, newNoteContent, onAddNote, patterns]);

  return (
    <div className="space-y-4">
      {/* Add note button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Заметки к секциям</p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={() => {
            patterns.tap();
            setNewNoteSection(sections[0]?.id || 'general');
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </Button>
      </div>

      {/* New note form */}
      <AnimatePresence>
        {newNoteSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-3 space-y-3">
              <select
                value={newNoteSection}
                onChange={(e) => setNewNoteSection(e.target.value)}
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="general">Общая заметка</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Введите заметку..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Сохранить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNewNoteSection(null)}>
                  Отмена
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      {notes.length === 0 && !newNoteSection ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Нет заметок</p>
          <p className="text-xs text-muted-foreground mt-1">
            Добавьте заметки для продюсирования
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-card rounded-lg border group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {note.sectionType || 'Общая'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString('ru-RU') : ''}
                    </span>
                  </div>
                  <p className="text-sm">{note.notes}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="h-5 text-[10px]">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    patterns.warning();
                    onDeleteNote(note.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StudioLyricsSheet = memo(function StudioLyricsSheet({
  isOpen,
  onClose,
  trackId,
  projectTrackId,
  lyricsTemplateId,
  initialLyrics = '',
  onLyricsSaved,
}: StudioLyricsSheetProps) {
  const { patterns } = useHaptic();
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    lyrics,
    sections,
    versions,
    sectionNotes,
    stats,
    isDirty,
    activeAITool,
    isLoading,
    isSaving,
    isRestoring,
    setLyrics,
    save,
    restoreVersion,
    selectAITool,
    closeAITool,
    addNote,
    deleteNote,
  } = useLyricsStudio({
    trackId,
    projectTrackId,
    lyricsTemplateId,
    initialLyrics,
    onSave: onLyricsSaved,
  });

  // Auto-focus textarea on open
  useEffect(() => {
    if (isOpen && viewMode === 'editor') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, viewMode]);

  // Handle section click - scroll to section
  const handleSectionClick = useCallback((section: LyricsSection) => {
    if (!textareaRef.current) return;

    const lines = lyrics.split('\n');
    let charIndex = 0;
    for (let i = 0; i < section.startLine && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charIndex, charIndex);
    
    // Calculate scroll position
    const lineHeight = 24;
    textareaRef.current.scrollTop = section.startLine * lineHeight;
  }, [lyrics]);

  // Handle save
  const handleSave = useCallback(async () => {
    patterns.success();
    await save();
  }, [save, patterns]);

  // Handle add note
  const handleAddNote = useCallback(async (sectionId: string, content: string) => {
    const section = sections.find(s => s.id === sectionId);
    await addNote({
      sectionId,
      sectionType: section?.type,
      notes: content,
    });
  }, [sections, addNote]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Lyrics Studio</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Редактор текста песни
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isDirty ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Сохранить
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Stats bar */}
        <StatsBar stats={stats} isDirty={isDirty} />

        {/* Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 grid grid-cols-4 h-10">
            <TabsTrigger value="editor" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              AI
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History className="w-3.5 h-3.5" />
              Версии
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Заметки
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="flex-1 flex flex-col min-h-0 m-0 p-0">
            <SectionMarkers sections={sections} onSectionClick={handleSectionClick} />
            <ScrollArea className="flex-1">
              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Напишите текст песни...

[Куплет 1]
Ваши строки здесь...

[Припев]
Припев здесь..."
                  className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="flex-1 m-0 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <AIToolsToolbar
                  activeToolId={activeAITool}
                  onToolSelect={selectAITool}
                  onClose={closeAITool}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 m-0 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <VersionHistoryView
                  versions={versions}
                  onRestore={restoreVersion}
                  isRestoring={isRestoring}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="flex-1 m-0 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <SectionNotesView
                  notes={sectionNotes}
                  sections={sections}
                  onAddNote={handleAddNote}
                  onDeleteNote={(noteId) => deleteNote(noteId)}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

export default StudioLyricsSheet;
