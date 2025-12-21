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
  FolderOpen
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
  SectionNotesPanel 
} from '@/components/lyrics-workspace';
import { useLyricsTemplates } from '@/hooks/useLyricsTemplates';
import { useSectionNotes, SaveSectionNoteData } from '@/hooks/useSectionNotes';
import { useAuth } from '@/hooks/useAuth';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

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
  const [title, setTitle] = useState('Новый текст');
  const [isDirty, setIsDirty] = useState(false);
  const [selectedSection, setSelectedSection] = useState<LyricsSection | null>(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
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
      await saveTemplate({
        name: title,
        lyrics,
        tags: enrichedTags.slice(0, 10),
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

      {/* Enriched Tags Bar */}
      <AnimatePresence>
        {enrichedTags.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/30 overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                Теги:
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {enrichedTags.slice(0, 8).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs whitespace-nowrap">
                    {tag}
                  </Badge>
                ))}
                {enrichedTags.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{enrichedTags.length - 8}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <LyricsWorkspace
          sections={sections}
          onChange={handleSectionsChange}
          onSave={handleSave}
          isSaving={isSavingLyrics}
        />
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
