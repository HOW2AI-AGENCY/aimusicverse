import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, GripVertical, Sparkles, Music2 } from 'lucide-react';
import { useLyricsWizardStore, SectionDefinition } from '@/stores/lyricsWizardStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STRUCTURE_TEMPLATES: Record<string, { name: string; description: string; sections: Omit<SectionDefinition, 'id'>[] }> = {
  pop: {
    name: 'Поп',
    description: 'Классическая поп-структура с запоминающимся припевом',
    sections: [
      { type: 'intro', name: 'Intro', lines: 2, description: 'Вступление' },
      { type: 'verse', name: 'Verse 1', lines: 4, description: 'Первый куплет' },
      { type: 'prechorus', name: 'Pre-Chorus', lines: 2, description: 'Подводка к припеву' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Припев' },
      { type: 'verse', name: 'Verse 2', lines: 4, description: 'Второй куплет' },
      { type: 'prechorus', name: 'Pre-Chorus', lines: 2, description: 'Подводка к припеву' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Припев' },
      { type: 'bridge', name: 'Bridge', lines: 4, description: 'Бридж' },
      { type: 'chorus', name: 'Final Chorus', lines: 4, description: 'Финальный припев' },
      { type: 'outro', name: 'Outro', lines: 2, description: 'Завершение' },
    ],
  },
  'hip-hop': {
    name: 'Хип-хоп',
    description: 'Куплеты с хуками для рэпа',
    sections: [
      { type: 'intro', name: 'Intro', lines: 2, description: 'Вступление' },
      { type: 'verse', name: 'Verse 1', lines: 8, description: '16 bars' },
      { type: 'hook', name: 'Hook', lines: 4, description: 'Хук/Припев' },
      { type: 'verse', name: 'Verse 2', lines: 8, description: '16 bars' },
      { type: 'hook', name: 'Hook', lines: 4, description: 'Хук/Припев' },
      { type: 'bridge', name: 'Bridge', lines: 4, description: 'Бридж' },
      { type: 'hook', name: 'Hook', lines: 4, description: 'Финальный хук' },
      { type: 'outro', name: 'Outro', lines: 2, description: 'Завершение' },
    ],
  },
  ballad: {
    name: 'Баллада',
    description: 'Эмоциональная структура для медленных песен',
    sections: [
      { type: 'intro', name: 'Intro', lines: 2, description: 'Мягкое вступление' },
      { type: 'verse', name: 'Verse 1', lines: 4, description: 'Первый куплет' },
      { type: 'verse', name: 'Verse 2', lines: 4, description: 'Второй куплет' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Эмоциональный припев' },
      { type: 'verse', name: 'Verse 3', lines: 4, description: 'Третий куплет' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Припев' },
      { type: 'bridge', name: 'Bridge', lines: 4, description: 'Кульминация' },
      { type: 'chorus', name: 'Final Chorus', lines: 4, description: 'Финальный припев' },
    ],
  },
  electronic: {
    name: 'Электроника',
    description: 'Структура с билдапами и дропами',
    sections: [
      { type: 'intro', name: 'Intro', lines: 2, description: 'Атмосферное вступление' },
      { type: 'build', name: 'Build', lines: 2, description: 'Нарастание' },
      { type: 'drop', name: 'Drop', lines: 2, description: 'Дроп' },
      { type: 'verse', name: 'Verse', lines: 4, description: 'Вокальная часть' },
      { type: 'build', name: 'Build', lines: 2, description: 'Нарастание' },
      { type: 'drop', name: 'Drop', lines: 2, description: 'Главный дроп' },
      { type: 'breakdown', name: 'Breakdown', lines: 4, description: 'Брейкдаун' },
      { type: 'build', name: 'Final Build', lines: 2, description: 'Финальное нарастание' },
      { type: 'drop', name: 'Final Drop', lines: 2, description: 'Финальный дроп' },
      { type: 'outro', name: 'Outro', lines: 2, description: 'Завершение' },
    ],
  },
  rock: {
    name: 'Рок',
    description: 'Классическая рок-структура с соло',
    sections: [
      { type: 'intro', name: 'Intro', lines: 2, description: 'Гитарное вступление' },
      { type: 'verse', name: 'Verse 1', lines: 4, description: 'Первый куплет' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Мощный припев' },
      { type: 'verse', name: 'Verse 2', lines: 4, description: 'Второй куплет' },
      { type: 'chorus', name: 'Chorus', lines: 4, description: 'Припев' },
      { type: 'solo', name: 'Guitar Solo', lines: 0, description: 'Гитарное соло' },
      { type: 'bridge', name: 'Bridge', lines: 4, description: 'Бридж' },
      { type: 'chorus', name: 'Final Chorus', lines: 4, description: 'Финальный припев' },
      { type: 'outro', name: 'Outro', lines: 2, description: 'Завершение' },
    ],
  },
};

const SECTION_TYPES = [
  { type: 'verse', name: 'Verse', icon: '📝' },
  { type: 'chorus', name: 'Chorus', icon: '🎵' },
  { type: 'prechorus', name: 'Pre-Chorus', icon: '⬆️' },
  { type: 'bridge', name: 'Bridge', icon: '🌉' },
  { type: 'hook', name: 'Hook', icon: '🪝' },
  { type: 'intro', name: 'Intro', icon: '🎬' },
  { type: 'outro', name: 'Outro', icon: '🔚' },
  { type: 'build', name: 'Build', icon: '📈' },
  { type: 'drop', name: 'Drop', icon: '💥' },
  { type: 'breakdown', name: 'Breakdown', icon: '🔻' },
  { type: 'solo', name: 'Solo', icon: '🎸' },
];

export function StructureStep() {
  const { concept, structure, setTemplate, setCustomStructure, addSection, removeSection } = useLyricsWizardStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const selectTemplate = (templateKey: string) => {
    const template = STRUCTURE_TEMPLATES[templateKey];
    if (template) {
      const sectionsWithIds = template.sections.map(s => ({
        ...s,
        id: generateId(),
      }));
      setTemplate(templateKey, sectionsWithIds);
    }
  };

  const handleAddSection = (type: string, name: string) => {
    addSection({
      id: generateId(),
      type,
      name: `${name} ${structure.sections.filter(s => s.type === type).length + 1}`,
      lines: type === 'solo' ? 0 : 4,
    });
  };

  const generateCustomStructure = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'suggest_structure',
          genre: concept.genre || 'pop',
          mood: concept.mood[0] || 'romantic',
          language: concept.language,
          theme: concept.theme,
        },
      });

      if (error) throw error;
      
      // Parse AI response and create sections
      if (data?.lyrics) {
        const lines = data.lyrics.split('\n').filter((l: string) => l.trim());
        const sections: SectionDefinition[] = [];
        
        lines.forEach((line: string) => {
          const match = line.match(/\[([^\]]+)\]/);
          if (match) {
            const name = match[1];
            const type = name.toLowerCase().replace(/\s*\d+$/, '').replace(' ', '');
            sections.push({
              id: generateId(),
              type,
              name,
              lines: 4,
            });
          }
        });

        if (sections.length > 0) {
          setCustomStructure(sections);
          toast.success('Структура сгенерирована');
        }
      }
    } catch (err) {
      console.error('Error generating structure:', err);
      toast.error('Не удалось сгенерировать структуру');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Выберите шаблон структуры</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateCustomStructure}
            disabled={isGenerating || !concept.theme}
            className="gap-1 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            {isGenerating ? 'Генерация...' : 'AI структура'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(STRUCTURE_TEMPLATES).map(([key, template]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:border-primary ${
                structure.templateName === key ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => selectTemplate(key)}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Music2 className="h-4 w-4" />
                  {template.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {structure.sections.length > 0 && (
        <div className="space-y-2">
          <Label>Структура песни</Label>
          <ScrollArea className="h-[200px] border rounded-md p-2">
            <div className="space-y-1">
              {structure.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="flex-1 text-sm">{section.name}</span>
                  {section.lines > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ~{section.lines} строк
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSection(section.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="space-y-2">
        <Label>Добавить секцию</Label>
        <div className="flex flex-wrap gap-1.5">
          {SECTION_TYPES.map((section) => (
            <Badge
              key={section.type}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleAddSection(section.type, section.name)}
            >
              <span className="mr-1">{section.icon}</span>
              {section.name}
              <Plus className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      </div>

      {structure.sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Выберите шаблон или создайте свою структуру
        </p>
      )}
    </div>
  );
}
