import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Music2, Plus, FileText, Download, Upload, Sparkles, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { LyricSection, SectionType, SECTION_LABELS } from './types';
import { SectionBlock } from './SectionBlock';
import { TagMenu } from './TagMenu';
import { SunoTimeline } from './SunoTimeline';
import { generateSunoPrompt, parseTextToSections, insertTagAtCursor } from './utils';
import { toast } from 'sonner';

interface SunoBlockEditorProps {
  initialSections?: LyricSection[];
  initialStylePrompt?: string;
  isInstrumental?: boolean;
  onSave: (data: { sections: LyricSection[]; stylePrompt: string; finalPrompt: string }) => void;
}

export const SunoBlockEditor = ({ 
  initialSections = [], 
  initialStylePrompt = '',
  isInstrumental = false,
  onSave 
}: SunoBlockEditorProps) => {
  const [sections, setSections] = useState<LyricSection[]>(initialSections);
  const [stylePrompt, setStylePrompt] = useState(initialStylePrompt);
  const [instrumental, setInstrumental] = useState(isInstrumental);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<{ id: string; cursorPos: number } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleAddSection = (type: SectionType) => {
    const existingCount = sections.filter((s) => s.type === type).length;
    const timestamp = Date.now();
    const newSection: LyricSection = {
      id: `${type}-${existingCount + 1}-${timestamp}`,
      type,
      header: `[${SECTION_LABELS[type].en}]`,
      content: '',
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (id: string, content: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
  };

  const handleOpenTagMenu = (sectionId: string, cursorPosition: number) => {
    setActiveSection({ id: sectionId, cursorPos: cursorPosition });
    setIsTagMenuOpen(true);
  };

  const handleSelectTag = (tag: string) => {
    if (!activeSection) return;

    const section = sections.find((s) => s.id === activeSection.id);
    if (!section) return;

    const { newText } = insertTagAtCursor(section.content, tag, activeSection.cursorPos);
    handleUpdateSection(activeSection.id, newText);
    setActiveSection(null);
  };

  const handleImport = () => {
    try {
      const parsed = parseTextToSections(importText);
      if (parsed.length === 0) {
        toast.error('Не удалось распознать структуру');
        return;
      }
      setSections(parsed);
      setImportText('');
      setShowImport(false);
      toast.success(`Импортировано ${parsed.length} секций`);
    } catch (error) {
      toast.error('Ошибка импорта');
    }
  };

  const handleExport = () => {
    const prompt = generateSunoPrompt(sections, stylePrompt);
    navigator.clipboard.writeText(prompt);
    toast.success('Промпт скопирован в буфер обмена');
  };

  const handleSave = () => {
    if (!instrumental && sections.length === 0) {
      toast.error('Добавьте хотя бы одну секцию');
      return;
    }

    const finalPrompt = instrumental 
      ? `[Style: ${stylePrompt}]\n[Instrumental]`
      : generateSunoPrompt(sections, stylePrompt);

    onSave({
      sections,
      stylePrompt,
      finalPrompt,
    });
  };

  return (
    <div className="space-y-4">
      {/* Style Prompt */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music2 className="w-4 h-4" />
            Стиль музыки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="style">Описание стиля</Label>
            <Input
              id="style"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="Например: энергичный рок, мощные гитары, драм-машина..."
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="instrumental" className="cursor-pointer">
              Инструментальная версия
            </Label>
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={setInstrumental}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {sections.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-4">
            <SunoTimeline sections={sections} />
          </CardContent>
        </Card>
      )}

      {/* Lyrics Editor - Hidden when instrumental */}
      {!instrumental && (
        <>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="editor">Редактор</TabsTrigger>
              <TabsTrigger value="import">Импорт/Экспорт</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4 mt-4">
              {/* Section Types */}
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Добавить секцию</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.entries(SECTION_LABELS).map(([type, { ru, color }]) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSection(type as SectionType)}
                        className={`${color} border-current`}
                      >
                        {ru}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sections List */}
              {sections.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {sections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <SectionBlock
                                  section={section}
                                  index={index}
                                  isFirst={index === 0}
                                  isLast={index === sections.length - 1}
                                  onUpdate={handleUpdateSection}
                                  onDelete={handleDeleteSection}
                                  onMoveUp={() => handleMoveSection(section.id, 'up')}
                                  onMoveDown={() => handleMoveSection(section.id, 'down')}
                                  onOpenTagMenu={handleOpenTagMenu}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <Card className="glass-card border-primary/20 p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Добавьте первую секцию, чтобы начать
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Импорт текста</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Вставьте текст с разметкой Suno..."
                    rows={8}
                    className="text-sm"
                    style={{ fontSize: '16px' }}
                  />
                  <Button onClick={handleImport} className="w-full gap-2">
                    <Upload className="w-4 h-4" />
                    Импортировать
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Экспорт промпта</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExport} variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Скопировать промпт
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full gap-2" size="lg">
        <Sparkles className="w-4 h-4" />
        Создать трек
      </Button>

      {/* Tag Menu */}
      <TagMenu
        isOpen={isTagMenuOpen}
        onClose={() => {
          setIsTagMenuOpen(false);
          setActiveSection(null);
        }}
        onSelectTag={handleSelectTag}
      />
    </div>
  );
};
