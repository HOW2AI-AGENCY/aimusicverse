/**
 * Lyrics Studio Page
 * Professional lyrics editing with section notes, audio references, and tag enrichment
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  LyricsWorkspace, 
  LyricsSection, 
  SectionNotesPanel,
  LyricsAIAssistant,
  TagsEditor
} from '@/components/lyrics-workspace';
import { useLyricsTemplates } from '@/hooks/useLyricsTemplates';
import { useSectionNotes, SaveSectionNoteData } from '@/hooks/useSectionNotes';
import { useAuth } from '@/hooks/useAuth';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { SEOHead, SEO_PRESETS } from '@/components/SEOHead';

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
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            className="text-lg font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
            placeholder="Название текста..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Templates */}
          <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <FolderOpen className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Мои тексты
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleNewDocument}
                >
                  <Plus className="w-4 h-4" />
                  Новый текст
                </Button>
                
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2 pr-4">
                    {templatesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : templates?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Нет сохраненных текстов
                      </p>
                    ) : (
                      templates?.map(template => (
                        <Card
                          key={template.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                            templateId === template.id ? 'border-primary' : ''
                          }`}
                          onClick={() => handleLoadTemplate(template)}
                        >
                          <p className="font-medium text-sm truncate">{template.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {template.lyrics.substring(0, 100)}...
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          {/* AI Assistant Toggle */}
          <Button 
            variant={aiPanelOpen ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setAiPanelOpen(!aiPanelOpen);
              hapticImpact('light');
            }}
          >
            <Bot className="w-5 h-5" />
          </Button>

          {/* Tags Toggle */}
          <Button 
            variant={tagsPanelOpen ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setTagsPanelOpen(!tagsPanelOpen);
              hapticImpact('light');
            }}
            className="relative"
          >
            <Tag className="w-5 h-5" />
            {(globalTags.length + enrichedTags.length) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                {globalTags.length + enrichedTags.length}
              </span>
            )}
          </Button>

          {/* Save */}
          <Button 
            onClick={handleSave}
            disabled={isSavingLyrics || !isDirty}
            size="sm"
            className="gap-2"
          >
            {isSavingLyrics ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Сохранить
          </Button>
        </div>
      </header>

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
          />
        </div>

        {/* AI Assistant Panel */}
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
                <LyricsAIAssistant
                  selectedText={selectedSection?.content || ''}
                  onInsertText={(text) => {
                    if (selectedSection) {
                      handleSectionsChange(
                        sections.map(s => 
                          s.id === selectedSection.id 
                            ? { ...s, content: s.content + '\n' + text }
                            : s
                        )
                      );
                    } else if (sections.length > 0) {
                      // Append to last section
                      const lastIdx = sections.length - 1;
                      handleSectionsChange(
                        sections.map((s, idx) => 
                          idx === lastIdx 
                            ? { ...s, content: s.content + '\n' + text }
                            : s
                        )
                      );
                    }
                    toast.success('Текст добавлен');
                  }}
                  onAddTags={(tags) => {
                    setGlobalTags(prev => [...new Set([...prev, ...tags])]);
                    setIsDirty(true);
                  }}
                  context={{
                    existingLyrics: sectionsToLyrics(sections),
                    sectionType: selectedSection?.type,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            // Update section tags
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
