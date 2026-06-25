/**
 * InlineLyricsEditor - Reusable inline lyrics editor with AI, templates and voice input
 * Used in: AddVocalsDialog, AudioRecordDialog
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PenLine, Sparkles, FileText, Mic, Loader2, Wand2, Tags, Clock, Tag, Check, Search } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useLyricsTemplates, LyricsTemplate } from "@/hooks/useLyricsTemplates";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, ru } from "@/lib/date-utils";

const GENRES = [
  { value: "pop", label: "Поп" },
  { value: "rock", label: "Рок" },
  { value: "hip-hop", label: "Хип-хоп" },
  { value: "electronic", label: "Электроника" },
  { value: "r&b", label: "R&B" },
  { value: "jazz", label: "Джаз" },
  { value: "folk", label: "Фолк" },
  { value: "ballad", label: "Баллада" },
];

const MOODS = [
  { value: "happy", label: "Весёлое" },
  { value: "sad", label: "Грустное" },
  { value: "energetic", label: "Энергичное" },
  { value: "romantic", label: "Романтичное" },
  { value: "melancholic", label: "Меланхоличное" },
  { value: "aggressive", label: "Агрессивное" },
  { value: "peaceful", label: "Спокойное" },
  { value: "inspiring", label: "Вдохновляющее" },
];

const STRUCTURES = [
  { value: "standard", label: "Стандартная" },
  { value: "simple", label: "Простая" },
  { value: "extended", label: "Расширенная" },
  { value: "hip-hop", label: "Хип-хоп" },
];

interface InlineLyricsEditorProps {
  value: string;
  onChange: (value: string) => void;
  onStyleChange?: (style: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

export function InlineLyricsEditor({
  value,
  onChange,
  onStyleChange,
  placeholder = "[Verse]\nТекст первого куплета...\n\n[Chorus]\nТекст припева...",
  minRows = 8,
  maxRows = 12,
  className,
}: InlineLyricsEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "ai" | "templates">("write");
  const [loading, setLoading] = useState(false);

  // AI generation state
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("pop");
  const [mood, setMood] = useState("inspiring");
  const [structure, setStructure] = useState("standard");
  const [language, setLanguage] = useState("ru");

  // Templates state
  const { templates, isLoading: templatesLoading } = useLyricsTemplates();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates =
    templates?.filter((template) => {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.lyrics.toLowerCase().includes(query) ||
        template.genre?.toLowerCase().includes(query) ||
        template.mood?.toLowerCase().includes(query)
      );
    }) || [];

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error("Укажите тему песни");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lyrics-assistant", {
        body: {
          action: "generate",
          theme,
          genre,
          mood,
          structure,
          language,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        onChange(data.lyrics);
        setActiveTab("write");
        toast.success("Текст сгенерирован!");
      }
    } catch (error: any) {
      logger.error("Generate lyrics error", { error });
      toast.error(error.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!value.trim()) {
      toast.error("Нет текста для улучшения");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lyrics-assistant", {
        body: {
          action: "improve",
          existingLyrics: value,
          language,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        onChange(data.lyrics);
        toast.success("Текст улучшен!");
      }
    } catch (error: any) {
      logger.error("Improve lyrics error", { error });
      toast.error(error.message || "Ошибка улучшения");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTags = async () => {
    if (!value.trim()) {
      toast.error("Нет текста для разметки");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lyrics-assistant", {
        body: {
          action: "add_tags",
          existingLyrics: value,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        onChange(data.lyrics);
        toast.success("Теги добавлены!");
      }
    } catch (error: any) {
      logger.error("Add tags error", { error });
      toast.error(error.message || "Ошибка добавления тегов");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: LyricsTemplate) => {
    onChange(template.lyrics);
    if (template.style && onStyleChange) {
      onStyleChange(template.style);
    }
    setActiveTab("write");
    toast.success("Шаблон применён");
  };

  const handleVoiceInput = (text: string) => {
    onChange(value ? `${value}\n${text}` : text);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <TabsList className="h-8">
            <TabsTrigger value="write" className="text-xs gap-1 px-2 h-6">
              <PenLine className="w-3 h-3" />
              Написать
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs gap-1 px-2 h-6">
              <Sparkles className="w-3 h-3" />
              AI
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1 px-2 h-6">
              <FileText className="w-3 h-3" />
              Шаблоны
            </TabsTrigger>
          </TabsList>

          <VoiceInputButton onResult={handleVoiceInput} context="lyrics" />
        </div>

        <TabsContent value="write" className="mt-0 space-y-2">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={minRows}
            className="resize-none font-mono text-sm"
          />

          {value.trim() && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImprove} disabled={loading} className="text-xs gap-1">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Улучшить
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddTags} disabled={loading} className="text-xs gap-1">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tags className="w-3 h-3" />}
                Добавить теги
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 Используйте теги [Verse], [Chorus], [Bridge] для структуры песни. AI будет петь этот текст.
          </p>
        </TabsContent>

        <TabsContent value="ai" className="mt-0 space-y-3">
          <div>
            <Label className="text-xs">Тема песни *</Label>
            <Input
              placeholder="О чём будет песня?"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Жанр</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g.value} value={g.value} className="text-xs">
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Настроение</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Структура</Label>
              <Select value={structure} onValueChange={setStructure}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRUCTURES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Язык</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru" className="text-xs">
                    Русский
                  </SelectItem>
                  <SelectItem value="en" className="text-xs">
                    English
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !theme.trim()} className="w-full h-8 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Сгенерировать текст
          </Button>
        </TabsContent>

        <TabsContent value="templates" className="mt-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>

          <ScrollArea className="h-48">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">{searchQuery ? "Ничего не найдено" : "Нет сохранённых текстов"}</p>
              </div>
            ) : (
              <div className="space-y-1.5 pr-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all",
                      "hover:border-primary/50 hover:bg-accent/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-xs line-clamp-1">{template.name}</h4>
                    </div>

                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1.5">
                      {template.lyrics.slice(0, 80)}...
                    </p>

                    <div className="flex items-center gap-1 flex-wrap">
                      {template.genre && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {template.genre}
                        </Badge>
                      )}
                      {template.mood && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {template.mood}
                        </Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(template.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
