import { motion } from '@/lib/motion';
import { X, Music, Tag, Folder, Disc, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';
import type { GraphNode, MetaTag, MusicStyle } from '@/hooks/useMusicGraph';

interface NodeDetailsProps {
  node: GraphNode;
  onClose: () => void;
  relatedNodes?: GraphNode[];
}

export function NodeDetails({ node, onClose, relatedNodes = [] }: NodeDetailsProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (node.type) {
      case 'genre': return <Disc className="w-5 h-5" />;
      case 'style': return <Music className="w-5 h-5" />;
      case 'tag': return <Tag className="w-5 h-5" />;
      case 'category': return <Folder className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (node.type) {
      case 'genre': return 'Жанр';
      case 'style': return 'Стиль';
      case 'tag': return 'Тег';
      case 'category': return 'Категория';
    }
  };

  const metadata = node.metadata as (MetaTag | MusicStyle) | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-xl z-10"
    >
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: node.color + '20' }}
          >
            <div style={{ color: node.color }}>
              {getIcon()}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{node.label}</h3>
            <Badge variant="outline" className="text-[10px]">
              {getTypeLabel()}
            </Badge>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-4">
          {/* Tag-specific info */}
          {node.type === 'tag' && metadata && 'syntax_format' in metadata && (
            <>
              <div>
                <h4 className="text-sm font-medium mb-2">Синтаксис</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                    {metadata.syntax_format || node.label}
                  </code>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => copyToClipboard(metadata.syntax_format || node.label)}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {metadata.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Описание</h4>
                  <p className="text-sm text-muted-foreground">{metadata.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Категория</h4>
                <Badge style={{ backgroundColor: node.color + '20', color: node.color }}>
                  {node.category?.replace(/_/g, ' ')}
                </Badge>
              </div>
            </>
          )}

          {/* Style-specific info */}
          {node.type === 'style' && metadata && 'primary_genre' in metadata && (
            <>
              <div>
                <h4 className="text-sm font-medium mb-2">Основной жанр</h4>
                <Badge style={{ backgroundColor: node.color + '20', color: node.color }}>
                  {metadata.primary_genre || 'Не указан'}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Популярность</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${(metadata.popularity_score || 0) * 10}%`,
                        backgroundColor: node.color 
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metadata.popularity_score}/10
                  </span>
                </div>
              </div>

              {metadata.is_fusion && (
                <div>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    Fusion стиль
                  </Badge>
                </div>
              )}

              {metadata.mood_atmosphere && metadata.mood_atmosphere.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Настроение</h4>
                  <div className="flex flex-wrap gap-1">
                    {metadata.mood_atmosphere.map((mood, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {mood}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {metadata.geographic_influence && metadata.geographic_influence.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Географическое влияние</h4>
                  <div className="flex flex-wrap gap-1">
                    {metadata.geographic_influence.map((geo, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {geo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(metadata.style_name)}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Копировать стиль
                </Button>
              </div>
            </>
          )}

          {/* Related nodes */}
          {relatedNodes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Связанные элементы ({relatedNodes.length})
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {relatedNodes.map(related => (
                    <div 
                      key={related.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: related.color }}
                      />
                      <span className="text-sm flex-1 truncate">{related.label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {related.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Usage tips */}
          <Separator />
          <div className="p-3 bg-primary/5 rounded-lg">
            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Совет
            </h4>
            <p className="text-xs text-muted-foreground">
              {node.type === 'tag' 
                ? 'Используйте этот тег в промпте генерации для точного контроля над звучанием.'
                : node.type === 'style'
                ? 'Добавьте название стиля в описание для характерного звучания.'
                : 'Исследуйте связанные элементы для создания уникальных комбинаций.'}
            </p>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
