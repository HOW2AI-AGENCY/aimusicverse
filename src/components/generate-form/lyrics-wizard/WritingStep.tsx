import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Wand2, ChevronLeft, ChevronRight, RefreshCw, Lightbulb, Undo2, Redo2 } from 'lucide-react';
import { useLyricsWizardStore, type LyricsWizardState } from '@/stores/lyricsWizardStore';
import { SectionTagSelector } from '@/components/generate-form/SectionTagSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface WritingStepProps {
  onStyleGenerated?: (style: string) => void;
}

export function WritingStep({ onStyleGenerated }: WritingStepProps) {
  const {
    concept,
    structure,
    writing,
    setWritingMode,
    setCurrentSection,
    updateSectionContent,
    updateSectionTags,
    initializeLyricSections,
    isGenerating,
    setIsGenerating,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useLyricsWizardStore();
  
  const [rhymeSuggestions, setRhymeSuggestions] = useState<string[]>([]);
  const [lineSuggestion, setLineSuggestion] = useState('');

  // Keyboard shortcuts for undo/redo (IMP013)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (writing.sections.length === 0 && structure.sections.length > 0) {
      initializeLyricSections();
    }
  }, [structure.sections, writing.sections.length, initializeLyricSections]);

  const currentSection = writing.sections[writing.currentSectionIndex];

  const generateSection = async () => {
    if (!currentSection) return;
    
    setIsGenerating(true);
    // Show progress notification
    const progressToast = toast.loading(`Генерируем ${currentSection.name}... ✨`, {
      description: 'ИИ создаёт текст с учётом вашей темы и настроения',
    });
    
    try {
      const previousSections = writing.sections
        .slice(0, writing.currentSectionIndex)
        .filter(s => s.content)
        .map(s => `[${s.name}]\n${s.content}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate_section',
          theme: concept.theme,
          genre: concept.genre || 'pop',
          mood: concept.mood.join(', ') || 'romantic',
          language: concept.language,
          sectionType: currentSection.type,
          sectionName: currentSection.name,
          previousLyrics: previousSections,
          linesCount: structure.sections[writing.currentSectionIndex]?.lines || 4,
        },
      });

      if (error) throw error;
      if (data?.lyrics) {
        updateSectionContent(currentSection.id, data.lyrics.trim());
        toast.success(`${currentSection.name} готов! 🎵`, {
          description: 'Текст создан и сохранён',
          id: progressToast,
        });
      } else {
        toast.error('Не удалось сгенерировать секцию', { id: progressToast });
      }
    } catch (err) {
      logger.error('Error generating section', { error: err });
      toast.error('Не удалось сгенерировать секцию', { 
        description: 'Попробуйте ещё раз',
        id: progressToast 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllSections = async () => {
    setIsGenerating(true);
    // Show detailed progress notification
    const progressToast = toast.loading('Генерируем весь трек... 🎼', {
      description: `Создаём ${structure.sections.length} секций с ИИ`,
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate',
          theme: concept.theme,
          genre: concept.genre || 'pop',
          mood: concept.mood.join(', ') || 'romantic',
          language: concept.language,
          structure: structure.sections.map(s => s.name).join(', '),
        },
      });

      if (error) throw error;
      
      if (data?.lyrics) {
        // Parse sections from generated lyrics
        const generatedText = data.lyrics;
        const sectionRegex = /\[([^\]]+)\]\n([\s\S]*?)(?=\[|$)/g;
        let match;
        let sectionsUpdated = 0;
        
        while ((match = sectionRegex.exec(generatedText)) !== null) {
          const sectionName = match[1];
          const content = match[2].trim();
          
          const section = writing.sections.find(s => 
            s.name.toLowerCase() === sectionName.toLowerCase() ||
            s.name.toLowerCase().includes(sectionName.toLowerCase())
          );
          
          if (section) {
            updateSectionContent(section.id, content);
            sectionsUpdated++;
          }
        }
        
        toast.success('Все секции готовы! 🎉', {
          description: `Создано ${sectionsUpdated} секций с текстом`,
          id: progressToast,
        });
        
        // Also generate style prompt based on concept
        if (onStyleGenerated) {
          const styleComponents = [
            concept.genre,
            concept.mood.join(', '),
            concept.referenceArtistName ? `в стиле ${concept.referenceArtistName}` : '',
            concept.theme ? `тема: ${concept.theme}` : '',
          ].filter(Boolean);
          
          const generatedStyle = styleComponents.join(', ');
          onStyleGenerated(generatedStyle);
          setTimeout(() => {
            toast.success('Стиль также сгенерирован! 🎨');
          }, 500);
        }
      } else {
        toast.error('Не удалось сгенерировать текст', { id: progressToast });
      }
    } catch (err) {
      logger.error('Error generating all sections', { error: err });
      toast.error('Не удалось сгенерировать текст', {
        description: 'Попробуйте сгенерировать секции по отдельности',
        id: progressToast,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestNextLine = async () => {
    if (!currentSection?.content) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'continue_line',
          theme: concept.theme,
          genre: concept.genre || 'pop',
          mood: concept.mood.join(', ') || 'romantic',
          language: concept.language,
          currentLyrics: currentSection.content,
          sectionType: currentSection.type,
        },
      });

      if (error) throw error;
      if (data?.lyrics) {
        setLineSuggestion(data.lyrics.trim());
      }
    } catch (err) {
      logger.error('Error suggesting line', { error: err });
      toast.error('Не удалось предложить строку');
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestRhymes = async () => {
    if (!currentSection?.content) return;
    
    const lines = currentSection.content.split('\n');
    const lastLine = lines[lines.length - 1];
    const lastWord = lastLine.split(' ').pop();
    
    if (!lastWord) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'suggest_rhymes',
          word: lastWord,
          language: concept.language,
          context: currentSection.content,
        },
      });

      if (error) throw error;
      if (data?.lyrics) {
        const rhymes = data.lyrics.split(',').map((r: string) => r.trim()).filter(Boolean);
        setRhymeSuggestions(rhymes.slice(0, 8));
      }
    } catch (err) {
      logger.error('Error suggesting rhymes', { error: err });
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptLineSuggestion = () => {
    if (lineSuggestion && currentSection) {
      const newContent = currentSection.content 
        ? `${currentSection.content}\n${lineSuggestion}`
        : lineSuggestion;
      updateSectionContent(currentSection.id, newContent);
      setLineSuggestion('');
    }
  };

  const goToPrevSection = () => {
    if (writing.currentSectionIndex > 0) {
      setCurrentSection(writing.currentSectionIndex - 1);
      setLineSuggestion('');
      setRhymeSuggestions([]);
    }
  };

  const goToNextSection = () => {
    if (writing.currentSectionIndex < writing.sections.length - 1) {
      setCurrentSection(writing.currentSectionIndex + 1);
      setLineSuggestion('');
      setRhymeSuggestions([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Режим написания</Label>
          <Tabs value={writing.mode} onValueChange={(v) => setWritingMode(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="ai" className="text-xs px-2">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="collab" className="text-xs px-2">
                <Wand2 className="h-3 w-3 mr-1" />
                Коллаб
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-xs px-2">
                ✏️ Ручной
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {writing.mode === 'ai' && (
          <Button
            size="sm"
            onClick={generateAllSections}
            disabled={isGenerating}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Сгенерировать всё
          </Button>
        )}
      </div>

      {/* Section Navigation - Mobile Optimized */}
      <div className="flex items-center justify-between border rounded-lg p-2 bg-muted/30 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevSection}
          disabled={writing.currentSectionIndex === 0}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          <span className="text-sm font-medium truncate">
            {currentSection?.name || 'Секция'}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">
            {writing.currentSectionIndex + 1}/{writing.sections.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextSection}
          disabled={writing.currentSectionIndex === writing.sections.length - 1}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Section Editor */}
      {currentSection && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>[{currentSection.name}]</span>
              <div className="flex gap-1">
                {/* Undo/Redo buttons (IMP013) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undo}
                      disabled={!canUndo()}
                      className="h-7 w-7 p-0"
                    >
                      <Undo2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Отменить (Ctrl+Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={redo}
                      disabled={!canRedo()}
                      className="h-7 w-7 p-0"
                    >
                      <Redo2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Повторить (Ctrl+Y)</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSection}
                  disabled={isGenerating}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  Генерировать
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={currentSection.content}
              onChange={(e) => updateSectionContent(currentSection.id, e.target.value)}
              placeholder={`Напишите текст для ${currentSection.name}...`}
              className="min-h-[150px] font-mono text-sm"
            />
            
            {/* Line Suggestion (Collab mode) */}
            {writing.mode === 'collab' && lineSuggestion && (
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm italic text-muted-foreground">{lineSuggestion}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setLineSuggestion('')}>
                      ✕
                    </Button>
                    <Button size="sm" onClick={acceptLineSuggestion}>
                      Принять
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Collab Controls */}
            {writing.mode === 'collab' && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestNextLine}
                  disabled={isGenerating || !currentSection.content}
                  className="gap-1 h-8 text-xs"
                >
                  <Lightbulb className="h-3 w-3" />
                  Предложить строку
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestRhymes}
                  disabled={isGenerating || !currentSection.content}
                  className="gap-1 h-8 text-xs"
                >
                  🎵 Рифмы
                </Button>
              </div>
            )}
            
            {/* Rhyme Suggestions */}
            {rhymeSuggestions.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Рифмы:</Label>
                <div className="flex flex-wrap gap-1">
                  {rhymeSuggestions.map((rhyme, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 text-xs"
                      onClick={() => {
                        const content = currentSection.content + ' ' + rhyme;
                        updateSectionContent(currentSection.id, content);
                      }}
                    >
                      {rhyme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Tags - Mobile-optimized */}
            <div className="pt-2 border-t">
              <SectionTagSelector
                selectedTags={currentSection.tags}
                onChange={(tags) => updateSectionTags(currentSection.id, tags)}
                sectionName={currentSection.name}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Overview */}
      <div className="space-y-2">
        <Label className="text-xs">Обзор секций</Label>
        <ScrollArea className="h-[100px]">
          <div className="flex gap-1 flex-wrap">
            {writing.sections.map((section, index) => (
              <Badge
                key={section.id}
                variant={index === writing.currentSectionIndex ? 'default' : section.content ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setCurrentSection(index)}
              >
                {section.name}
                {section.content && ' ✓'}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
