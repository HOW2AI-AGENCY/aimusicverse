/**
 * Lyrics Studio Page
 * Professional lyrics editing with section notes, audio references, and tag enrichment
 * Optimized for mobile with bottom sheets and touch-friendly controls
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  FileText, 
  Sparkles, 
  Tag,
  Music2,
  Loader2,
  FolderOpen,
  Bot,
  X,
  MoreVertical,
  PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  LyricsWorkspace, 
  LyricsSection, 
  SectionNotesPanel,
  TagsEditor
} from '@/components/lyrics-workspace';
import { LyricsAIChatAgent } from '@/components/lyrics-workspace/LyricsAIChatAgent';
import { useLyricsTemplates } from '@/hooks/useLyricsTemplates';
import { useSectionNotes, SaveSectionNoteData } from '@/hooks/useSectionNotes';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';
import { AppHeader } from '@/components/layout/AppHeader';
import { EditableTitle } from '@/components/ui/editable-title';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

// Parse lyrics text into sections
function parseLyricsToSections(lyrics: string): LyricsSection[] {
  if (!lyrics.trim()) return [];
  
  const sections: LyricsSection[] = [];
  const lines = lyrics.split('\n');
  let currentSection: LyricsSection | null = null;
  let currentContent: string[] = [];
  
  const sectionPatterns = [
    { pattern: /^\[(?:Verse|Куплет)/i, type: 'verse' as const },
    { pattern: /^\[(?:Chorus|Припев)/i, type: 'chorus' as const },
    { pattern: /^\[(?:Bridge|Бридж)/i, type: 'bridge' as const },
    { pattern: /^\[(?:Intro|Интро)/i, type: 'intro' as const },
    { pattern: /^\[(?:Outro|Аутро)/i, type: 'outro' as const },
    { pattern: /^\[(?:Hook|Хук)/i, type: 'hook' as const },
    { pattern: /^\[(?:Pre-?Chorus|Пре-?припев)/i, type: 'prechorus' as const },
    { pattern: /^\[(?:Breakdown|Брейкдаун)/i, type: 'breakdown' as const },
  ];

  for (const line of lines) {
    let foundSection = false;
    
    for (const { pattern, type } of sectionPatterns) {
      if (pattern.test(line)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          id: `${type}-${Date.now()}-${sections.length}`,
          type,
          content: '',
          tags: [],
        };
        currentContent = [];
        foundSection = true;
        break;
      }
    }
    
    if (!foundSection && line.trim()) {
      currentContent.push(line);
    }
  }
  
  // Add last section
  if (currentSection && currentContent.length > 0) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }
  
  // If no sections found, create one verse
  if (sections.length === 0 && lyrics.trim()) {
    sections.push({
      id: `verse-${Date.now()}`,
      type: 'verse',
      content: lyrics.trim(),
      tags: [],
    });
  }
  
  return sections;
}

// Convert sections back to lyrics text
function sectionsToLyrics(sections: LyricsSection[]): string {
  const typeLabels: Record<string, string> = {
    verse: 'Verse',
    chorus: 'Chorus',
    bridge: 'Bridge',
    intro: 'Intro',
    outro: 'Outro',
    hook: 'Hook',
    prechorus: 'Pre-Chorus',
    breakdown: 'Breakdown',
  };
  
  let verseCount = 0;
  let chorusCount = 0;
  
  return sections.map(section => {
    let label = typeLabels[section.type] || 'Section';
    if (section.type === 'verse') {
      verseCount++;
      label = `Verse ${verseCount}`;
    } else if (section.type === 'chorus') {
      chorusCount++;
      if (chorusCount > 1) label = 'Chorus';
    }
    
    return `[${label}]\n${section.content}`;
  }).join('\n\n');
}

export default function LyricsStudio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  const { templates, saveTemplate, isLoading: templatesLoading } = useLyricsTemplates();
  const { sectionNotes, saveSectionNote, getNoteForSection, getAllSuggestedTags, isSaving } = useSectionNotes(templateId || undefined);
  
  const [sections, setSections] = useState<LyricsSection[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [title, setTitle] = useState('Новый текст');
  const [isDirty, setIsDirty] = useState(false);
  const [selectedSection, setSelectedSection] = useState<LyricsSection | null>(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [isSavingLyrics, setIsSavingLyrics] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Load template if provided
  useMemo(() => {
    if (templateId && templates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setTitle(template.name);
        setSections(parseLyricsToSections(template.lyrics));
        setIsDirty(false);
      }
    }
  }, [templateId, templates]);

  // Get all enriched tags from section notes
  const enrichedTags = useMemo(() => getAllSuggestedTags(), [getAllSuggestedTags]);

  const handleSectionsChange = useCallback((newSections: LyricsSection[]) => {
    setSections(newSections);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) {
      toast.error('Войдите для сохранения');
      return;
    }

    setIsSavingLyrics(true);
    try {
      const lyrics = sectionsToLyrics(sections);
      const allTags = [...new Set([...globalTags, ...enrichedTags])].slice(0, 15);
      await saveTemplate({
        name: title,
        lyrics,
        tags: allTags,
      });
      setIsDirty(false);
      toast.success('Текст сохранен');
      hapticImpact('medium');
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsSavingLyrics(false);
    }
  }, [user, sections, title, enrichedTags, saveTemplate]);

  const handleOpenNotes = useCallback((section: LyricsSection) => {
    setSelectedSection(section);
    setNotesPanelOpen(true);
    hapticImpact('light');
  }, []);

  const handleSaveNote = useCallback(async (data: SaveSectionNoteData) => {
    await saveSectionNote(data);
  }, [saveSectionNote]);

  const handleLoadTemplate = useCallback((template: { id: string; name: string; lyrics: string }) => {
    navigate(`/lyrics-studio?template=${template.id}`);
    setTemplatesOpen(false);
    hapticImpact('light');
  }, [navigate]);

  const handleNewDocument = useCallback(() => {
    setSections([]);
    setTitle('Новый текст');
    setIsDirty(false);
    navigate('/lyrics-studio');
    hapticImpact('light');
  }, [navigate]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Using AppHeader pattern for Telegram Mini App */}
      <AppHeader
        title={title}
        titleElement={
          <EditableTitle
            value={title}
            onChange={(newTitle) => {
              setTitle(newTitle);
              setIsDirty(true);
            }}
            placeholder="Название текста"
            size="md"
          />
        }
        icon={<PenLine className="w-4 h-4 text-primary" />}
        leftAction={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
        rightAction={
          <div className="flex items-center gap-1">
            <Button 
              onClick={handleSave}
              disabled={isSavingLyrics || !isDirty}
              size="icon"
              variant={isDirty ? "default" : "ghost"}
              className="h-8 w-8"
            >
              {isSavingLyrics ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => setTemplatesOpen(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Мои тексты
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setAiPanelOpen(true);
                  hapticImpact('light');
                }}>
                  <Bot className="w-4 h-4 mr-2" />
                  AI Ассистент
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setTagsPanelOpen(true);
                  hapticImpact('light');
                }}>
                  <Tag className="w-4 h-4 mr-2" />
                  Теги ({globalTags.length + enrichedTags.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Новый текст
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Mobile Templates Drawer */}
      {isMobile && (
        <Drawer open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-3">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Мои тексты
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-12"
                onClick={handleNewDocument}
              >
                <Plus className="w-5 h-5" />
                Новый текст
              </Button>
              
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-2">
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : templates?.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Нет сохраненных текстов
                      </p>
                    </div>
                  ) : (
                    templates?.map(template => (
                      <Card
                        key={template.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all active:scale-[0.98]",
                          templateId === template.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <p className="font-medium truncate">{template.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                          {template.lyrics.substring(0, 80)}...
                        </p>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Tags Panel */}
      <AnimatePresence>
        {tagsPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/50 overflow-hidden bg-muted/30"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Теги для генерации
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTagsPanelOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <TagsEditor
                tags={globalTags}
                onChange={(tags) => {
                  setGlobalTags(tags);
                  setIsDirty(true);
                }}
                suggestedTags={enrichedTags}
                maxTags={15}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enriched Tags Bar (collapsed when Tags Panel is open) */}
      <AnimatePresence>
        {!tagsPanelOpen && (globalTags.length > 0 || enrichedTags.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/30 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setTagsPanelOpen(true)}
          >
            <div className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Tag className="w-3.5 h-3.5" />
                Теги:
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {[...globalTags, ...enrichedTags].slice(0, 8).map((tag, idx) => (
                  <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs whitespace-nowrap">
                    {tag}
                  </Badge>
                ))}
                {(globalTags.length + enrichedTags.length) > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{globalTags.length + enrichedTags.length - 8}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with AI Panel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Lyrics Workspace */}
        <div className="flex-1 overflow-hidden">
          <LyricsWorkspace
            sections={sections}
            onChange={handleSectionsChange}
            onSave={handleSave}
            isSaving={isSavingLyrics}
            hideSaveButton
            onSectionSelect={setSelectedSection}
          />
        </div>

        {/* AI Assistant Panel - Desktop sidebar */}
        {!isMobile && (
          <AnimatePresence>
            {aiPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-border/50 overflow-hidden bg-muted/20"
              >
                <div className="w-80 h-full overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      AI-ассистент
                    </h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAiPanelOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <LyricsAIChatAgent
                    existingLyrics={sectionsToLyrics(sections)}
                    selectedSection={selectedSection ? {
                      type: selectedSection.type,
                      content: selectedSection.content,
                    } : undefined}
                    globalTags={globalTags}
                    sectionTags={selectedSection?.tags}
                    onInsertLyrics={(text: string) => {
                      if (selectedSection) {
                        handleSectionsChange(
                          sections.map(s => 
                            s.id === selectedSection.id 
                              ? { ...s, content: s.content + '\n' + text }
                              : s
                          )
                        );
                      } else if (sections.length > 0) {
                        const lastIdx = sections.length - 1;
                        handleSectionsChange(
                          sections.map((s, idx) => 
                            idx === lastIdx 
                              ? { ...s, content: s.content + '\n' + text }
                              : s
                          )
                        );
                      } else {
                        // No sections yet: parse text into sections
                        const parsedSections = parseLyricsToSections(text);
                        handleSectionsChange(parsedSections);
                      }
                      setIsDirty(true);
                      setAiPanelOpen(false);
                    }}
                    onReplaceLyrics={(text: string) => {
                      if (selectedSection) {
                        handleSectionsChange(
                          sections.map(s => 
                            s.id === selectedSection.id 
                              ? { ...s, content: text }
                              : s
                          )
                        );
                        setIsDirty(true);
                        setAiPanelOpen(false);
                      }
                    }}
                    onAddTags={(tags: string[]) => {
                      setGlobalTags(prev => [...new Set([...prev, ...tags])]);
                      setIsDirty(true);
                    }}
                    className="h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* AI Assistant - Mobile Bottom Drawer */}
      {isMobile && (
        <Drawer open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader className="border-b pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DrawerTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <span>AI Lyrics Agent</span>
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAiPanelOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>
            <LyricsAIChatAgent
              existingLyrics={sectionsToLyrics(sections)}
              selectedSection={selectedSection ? {
                type: selectedSection.type,
                content: selectedSection.content,
              } : undefined}
              globalTags={globalTags}
              sectionTags={selectedSection?.tags}
              onInsertLyrics={(text: string) => {
                if (selectedSection) {
                  handleSectionsChange(
                    sections.map(s => 
                      s.id === selectedSection.id 
                        ? { ...s, content: s.content + '\n' + text }
                        : s
                    )
                  );
                } else if (sections.length > 0) {
                  const lastIdx = sections.length - 1;
                  handleSectionsChange(
                    sections.map((s, idx) => 
                      idx === lastIdx 
                        ? { ...s, content: s.content + '\n' + text }
                        : s
                    )
                  );
                } else {
                  // No sections yet: parse text into sections
                  const parsedSections = parseLyricsToSections(text);
                  handleSectionsChange(parsedSections);
                }
                setIsDirty(true);
                setAiPanelOpen(false);
              }}
              onReplaceLyrics={(text: string) => {
                if (selectedSection) {
                  handleSectionsChange(
                    sections.map(s => 
                      s.id === selectedSection.id 
                        ? { ...s, content: text }
                        : s
                    )
                  );
                  setIsDirty(true);
                  setAiPanelOpen(false);
                }
              }}
              onAddTags={(tags: string[]) => {
                setGlobalTags(prev => [...new Set([...prev, ...tags])]);
                setIsDirty(true);
              }}
              className="flex-1 overflow-hidden"
            />
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile FAB for AI Assistant - positioned above bottom nav */}
      {isMobile && !aiPanelOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed z-50"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
            right: '1rem'
          }}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-xl shadow-primary/30 bg-gradient-to-br from-primary to-primary/80"
            onClick={() => {
              setAiPanelOpen(true);
              hapticImpact('medium');
            }}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Section Notes Panel */}
      {selectedSection && (
        <SectionNotesPanel
          open={notesPanelOpen}
          onOpenChange={setNotesPanelOpen}
          sectionId={selectedSection.id}
          sectionType={selectedSection.type}
          sectionContent={selectedSection.content}
          position={sections.findIndex(s => s.id === selectedSection.id)}
          existingNote={getNoteForSection(selectedSection.id)}
          lyricsTemplateId={templateId || undefined}
          onSave={handleSaveNote}
          onEnrichWithTags={(tags) => {
            handleSectionsChange(
              sections.map(s => 
                s.id === selectedSection.id 
                  ? { ...s, tags: [...new Set([...(s.tags || []), ...tags])] }
                  : s
              )
            );
          }}
        />
      )}
    </div>
  );
}
