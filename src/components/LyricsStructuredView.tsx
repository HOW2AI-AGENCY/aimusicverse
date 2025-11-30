import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LyricSection {
  type: string;
  label: string;
  content: string;
  color: string;
}

interface LyricsStructuredViewProps {
  lyrics: string;
  title?: string;
}

export function LyricsStructuredView({ lyrics, title }: LyricsStructuredViewProps) {
  const [copied, setCopied] = useState(false);

  // Parse lyrics into sections
  const parseLyrics = (text: string): LyricSection[] => {
    const sections: LyricSection[] = [];
    const lines = text.split('\n');
    let currentSection: LyricSection | null = null;

    const sectionColors: Record<string, string> = {
      intro: 'text-green-400 bg-green-400/10 border-green-400/20',
      verse: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      chorus: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      bridge: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      outro: 'text-red-400 bg-red-400/10 border-red-400/20',
      hook: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
      pre: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    };

    for (const line of lines) {
      const sectionMatch = line.match(/\[(.*?)\]/);
      
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const sectionName = sectionMatch[1].toLowerCase();
        const baseType = sectionName.split(/\s+/)[0];
        const color = sectionColors[baseType] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        
        currentSection = {
          type: sectionName,
          label: sectionMatch[1],
          content: '',
          color,
        };
      } else if (currentSection && line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseLyrics(lyrics);

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    toast.success('Текст скопирован');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="glass-card border-primary/20 overflow-hidden">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border/50 bg-transparent">
          <TabsTrigger value="overview" className="rounded-none">Обзор</TabsTrigger>
          <TabsTrigger value="text" className="rounded-none">Текст</TabsTrigger>
          <TabsTrigger value="versions" className="rounded-none">Версии</TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-none">Анализ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4 m-0">
          <div className="space-y-4">
            {title && <h3 className="font-semibold text-lg">{title}</h3>}
            <div className="flex gap-2 flex-wrap">
              {sections.map((section, index) => (
                <Badge key={index} variant="outline" className={section.color}>
                  {section.label}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="p-0 m-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-6">
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <Badge 
                      variant="outline"
                      className={`${section.color} border px-3 py-1`}
                    >
                      {section.label}
                    </Badge>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-primary/30">
                      {section.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Нет лирики для отображения</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50">
            <Button
              onClick={handleCopy}
              className="w-full gap-2"
              variant="default"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Копировать текст
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="p-6 m-0">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Управление версиями будет доступно</p>
            <p className="text-sm">в следующем обновлении</p>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="p-4 m-0">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Структура композиции</p>
              <div className="flex gap-2 flex-wrap">
                {sections.map((section, index) => (
                  <Badge key={index} variant="outline" className={section.color}>
                    {section.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Статистика</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Секций</p>
                  <p className="text-2xl font-bold text-primary">{sections.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Строк</p>
                  <p className="text-2xl font-bold text-primary">
                    {lyrics.split('\n').filter(l => l.trim() && !l.match(/\[.*?\]/)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
