import { useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, Lightbulb, Copy, Sparkles } from 'lucide-react';
import { useLyricsWizardStore } from '@/stores/lyricsWizardStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { logger } from '@/lib/logger';

const MAX_LYRICS_LENGTH = 3000;

// Configure DOMPurify for safe HTML rendering
const sanitizeConfig = {
  ALLOWED_TAGS: ['span'],
  ALLOWED_ATTR: ['class'],
};

export function FinalizeStep() {
  const {
    concept,
    writing,
    enrichment,
    validation,
    validateLyrics,
    getFinalLyrics,
    isGenerating,
    setIsGenerating,
  } = useLyricsWizardStore();

  useEffect(() => {
    validateLyrics();
  }, [writing.sections, enrichment, validateLyrics]);

  const finalLyrics = getFinalLyrics();
  const charPercentage = Math.min((validation.characterCount / MAX_LYRICS_LENGTH) * 100, 100);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalLyrics);
    toast.success('Текст скопирован');
  };

  const optimizeForSuno = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'optimize_for_suno',
          lyrics: finalLyrics,
          genre: concept.genre || 'pop',
          language: concept.language,
        },
      });

      if (error) throw error;
      
      if (data?.lyrics) {
        toast.success('Текст оптимизирован для Suno');
      }
    } catch (err) {
      logger.error('Error optimizing lyrics', { error: err });
      toast.error('Не удалось оптимизировать текст');
    } finally {
      setIsGenerating(false);
    }
  };

  // Safely highlight tags in lyrics with DOMPurify sanitization
  const highlightedLyrics = useMemo(() => {
    // First escape any existing HTML to prevent XSS
    const escaped = finalLyrics
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Then add our safe highlighting spans
    const highlighted = escaped
      .replace(/\[([^\]]+)\]/g, '<span class="text-primary font-semibold">[$1]</span>')
      .replace(/\(([^)]+)\)/g, '<span class="text-muted-foreground italic">($1)</span>');
    
    // Sanitize the final output
    return DOMPurify.sanitize(highlighted, sanitizeConfig);
  }, [finalLyrics]);

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Длина текста</Label>
            <span className="text-xs text-muted-foreground">
              {validation.characterCount} / {MAX_LYRICS_LENGTH}
            </span>
          </div>
          <Progress 
            value={charPercentage} 
            className={charPercentage > 90 ? 'bg-destructive/20' : ''}
          />
        </div>
        
        <Badge variant={validation.isValid ? 'default' : 'destructive'} className="gap-1">
          {validation.isValid ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Готово
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              Проблемы
            </>
          )}
        </Badge>
      </div>

      {/* Warnings & Suggestions */}
      {(validation.warnings.length > 0 || validation.suggestions.length > 0) && (
        <div className="space-y-2">
          {validation.warnings.map((warning, i) => (
            <Alert key={i} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Внимание</AlertTitle>
              <AlertDescription className="text-xs">{warning}</AlertDescription>
            </Alert>
          ))}
          
          {validation.suggestions.map((suggestion, i) => (
            <Alert key={i}>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle className="text-sm">Рекомендация</AlertTitle>
              <AlertDescription className="text-xs">{suggestion}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tags Summary */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-xs">Примененные теги</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-1">
            {enrichment.vocalTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">🎤 {tag}</Badge>
            ))}
            {enrichment.instrumentTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">🎸 {tag}</Badge>
            ))}
            {enrichment.dynamicTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">⚡ {tag}</Badge>
            ))}
            {enrichment.emotionalCues.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">💜 {tag}</Badge>
            ))}
            {enrichment.vocalTags.length === 0 && 
             enrichment.instrumentTags.length === 0 && 
             enrichment.dynamicTags.length === 0 && 
             enrichment.emotionalCues.length === 0 && (
              <span className="text-xs text-muted-foreground">Нет тегов</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lyrics Preview */}
      <Card>
        <CardHeader className="py-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Предпросмотр</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Копировать
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={optimizeForSuno}
              disabled={isGenerating}
              className="h-7 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Оптимизировать
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
            <pre 
              className="text-sm whitespace-pre-wrap font-mono"
              dangerouslySetInnerHTML={{ __html: highlightedLyrics }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded-md">
          <div className="text-lg font-bold">{writing.sections.length}</div>
          <div className="text-xs text-muted-foreground">Секций</div>
        </div>
        <div className="p-2 bg-muted/50 rounded-md">
          <div className="text-lg font-bold">
            {writing.sections.filter(s => s.content).length}
          </div>
          <div className="text-xs text-muted-foreground">Заполнено</div>
        </div>
        <div className="p-2 bg-muted/50 rounded-md">
          <div className="text-lg font-bold">
            {enrichment.vocalTags.length + 
             enrichment.instrumentTags.length + 
             enrichment.dynamicTags.length + 
             enrichment.emotionalCues.length}
          </div>
          <div className="text-xs text-muted-foreground">Тегов</div>
        </div>
      </div>
    </div>
  );
}
