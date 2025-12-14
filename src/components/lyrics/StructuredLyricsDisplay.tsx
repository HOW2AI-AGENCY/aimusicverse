import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Music2, Tag, Info, List, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LyricsParser, type ParsedLyrics, type LyricsSection } from '@/lib/lyrics/LyricsParser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StructuredLyricsDisplayProps {
  lyrics: string;
  title?: string;
  style?: string;
  showMetadata?: boolean;
  className?: string;
}

const TAG_TYPE_COLORS = {
  structural: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  vocal: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  dynamic: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  instrumental: 'bg-green-500/10 text-green-500 border-green-500/20',
  emotional: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
};

const SECTION_TYPE_COLORS = {
  intro: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  verse: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  'pre-chorus': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  chorus: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  bridge: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  outro: 'bg-red-500/10 text-red-500 border-red-500/30',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const TAG_TYPE_INFO = {
  structural: {
    icon: List,
    description: 'Структурные теги определяют секции песни',
    examples: '[Verse], [Chorus], [Bridge], [Intro], [Outro]',
  },
  vocal: {
    icon: Music2,
    description: 'Вокальные теги задают характер исполнения',
    examples: '[Male Vocal], [Falsetto], [Whisper], [Belt]',
  },
  dynamic: {
    icon: Tag,
    description: 'Динамические теги управляют энергией',
    examples: '[Build], [Drop], [Breakdown], [Climax]',
  },
  instrumental: {
    icon: Music2,
    description: 'Инструментальные теги указывают инструменты',
    examples: '[Guitar Solo], [Piano], [Drums], [Synth]',
  },
  emotional: {
    icon: Info,
    description: 'Эмоциональные указания в круглых скобках',
    examples: '(softly), (powerfully), (with emotion), (tenderly)',
  },
};

export function StructuredLyricsDisplay({
  lyrics,
  title,
  style,
  showMetadata = true,
  className,
}: StructuredLyricsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'raw' | 'tags'>('structured');
  
  // Parse lyrics
  const parsed = useMemo(() => LyricsParser.parse(lyrics), [lyrics]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopied(true);
      toast.success('Текст скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };
  
  const renderSectionTags = (section: LyricsSection) => {
    if (section.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {section.tags.map((tag, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-2 py-0.5',
                    TAG_TYPE_COLORS[tag.type]
                  )}
                >
                  {tag.format === 'bracket' ? '[' : '('}
                  {tag.value}
                  {tag.format === 'bracket' ? ']' : ')'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {TAG_TYPE_INFO[tag.type].description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };
  
  const renderSection = (section: LyricsSection) => {
    // Remove tags from content for clean display
    const cleanContent = section.content
      .replace(/\[([^\]]+)\]/g, '')
      .replace(/\(([^)]+)\)/g, '')
      .trim();
    
    return (
      <div key={section.id} className="mb-6">
        <Badge
          variant="outline"
          className={cn(
            'mb-2 px-3 py-1 text-sm font-medium',
            SECTION_TYPE_COLORS[section.type]
          )}
        >
          {section.name}
        </Badge>
        
        {renderSectionTags(section)}
        
        <div className="pl-4 border-l-2 border-primary/20">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {cleanContent}
          </p>
        </div>
      </div>
    );
  };
  
  if (!lyrics.trim()) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Music2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Текст песни отсутствует
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Metadata Header */}
      {showMetadata && (title || style) && (
        <div className="p-4 border-b bg-muted/30">
          {title && (
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
          )}
          {style && (
            <p className="text-sm text-muted-foreground">{style}</p>
          )}
        </div>
      )}
      
      {/* Warnings */}
      {parsed.warnings.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500 mb-1">
              ⚠️ Предупреждения:
            </p>
            <ul className="text-xs text-yellow-600/80 dark:text-yellow-500/80 space-y-1">
              {parsed.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <div className="border-b px-4">
          <TabsList className="w-full grid grid-cols-3 bg-transparent">
            <TabsTrigger value="structured" className="text-xs">
              <List className="w-3 h-3 mr-1" />
              Структура
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Исходный
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              Теги
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Structured View */}
        <TabsContent value="structured" className="m-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              {parsed.sections.length > 0 ? (
                parsed.sections.map(renderSection)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Структурированных секций не найдено</p>
                  <p className="text-xs mt-1">Добавьте теги [Verse], [Chorus] и т.д.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Raw View */}
        <TabsContent value="raw" className="m-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {lyrics}
              </pre>
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Tags View */}
        <TabsContent value="tags" className="m-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-4">
              {/* Tags Summary */}
              {Object.entries(parsed.tags).map(([type, tagList]) => {
                if (tagList.length === 0) return null;
                
                const tagType = type as keyof typeof TAG_TYPE_INFO;
                const info = TAG_TYPE_INFO[tagType];
                const Icon = info.icon;
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium capitalize">
                        {type === 'pre-chorus' ? 'Pre-Chorus' : type.replace('-', ' ')}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {info.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {tagList.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={cn('text-xs', TAG_TYPE_COLORS[tagType])}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground/60 italic mt-1">
                      Примеры: {info.examples}
                    </p>
                  </div>
                );
              })}
              
              {Object.values(parsed.tags).every(arr => arr.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Теги не найдены</p>
                  <p className="text-xs mt-1">Добавьте теги Suno для улучшения качества</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {parsed.sections.length} секций • {parsed.tags.structural.length + parsed.tags.vocal.length + parsed.tags.dynamic.length + parsed.tags.instrumental.length + parsed.tags.emotional.length} тегов
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Копировать
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
