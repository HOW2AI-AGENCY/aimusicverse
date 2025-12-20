/**
 * InlineSectionReplaceForm
 * 
 * Compact inline form for section replacement.
 * Appears between sections and stems when user clicks "ЗАМЕНИТЬ".
 */

import { memo, useState } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Wand2, ChevronDown, ChevronUp, Music } from 'lucide-react';
import { toast } from 'sonner';

interface InlineSectionReplaceFormProps {
  section: DetectedSection;
  sectionIndex: number;
  trackId: string;
  trackTags?: string | null;
  duration: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_PRESETS = [
  { id: 'energetic', label: '⚡ Энергичнее', prompt: 'more energetic, higher tempo, powerful' },
  { id: 'soft', label: '🎵 Мягче', prompt: 'softer, gentler, acoustic feel' },
  { id: 'epic', label: '🎬 Эпичнее', prompt: 'epic, orchestral, cinematic' },
  { id: 'minimal', label: '🎹 Минимал', prompt: 'minimal, stripped down, simple' },
];

export const InlineSectionReplaceForm = memo(({
  section,
  sectionIndex,
  trackId,
  trackTags,
  duration,
  onClose,
  onSuccess,
}: InlineSectionReplaceFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState(trackTags || '');
  const [lyrics, setLyrics] = useState(section.lyrics || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { setActiveTask } = useSectionEditorStore();
  const replaceMutation = useReplaceSectionMutation();
  
  const sectionDuration = section.endTime - section.startTime;
  const maxDuration = duration > 0 ? duration * 0.5 : 120;
  const isValidDuration = sectionDuration > 0 && sectionDuration <= maxDuration;
  
  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(prev => prev ? `${prev}, ${presetPrompt}` : presetPrompt);
  };
  
  const handleSubmit = async () => {
    if (!isValidDuration) return;
    
    try {
      // Build final prompt with lyrics if changed
      let finalPrompt = prompt;
      if (lyrics && lyrics !== section.lyrics) {
        finalPrompt = lyrics + (prompt ? `\n\n${prompt}` : '');
      }
      
      const result = await replaceMutation.mutateAsync({
        trackId,
        prompt: finalPrompt || undefined,
        tags: tags || undefined,
        infillStartS: Math.round(section.startTime * 10) / 10,
        infillEndS: Math.round(section.endTime * 10) / 10,
      });
      
      if (result?.taskId) {
        setActiveTask(result.taskId);
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Замена секции "{section.label}"</h4>
              <p className="text-xs text-muted-foreground">
                {formatTime(section.startTime)} - {formatTime(section.endTime)} ({formatTime(sectionDuration)})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_PRESETS.map((preset) => (
            <Badge
              key={preset.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
              onClick={() => handlePresetClick(preset.prompt)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
        
        {/* Prompt input */}
        <div className="space-y-3">
          <Input
            placeholder="Как изменить секцию? (опционально)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-sm"
          />
          
          {/* Advanced options toggle */}
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Дополнительно
          </button>
          
          {/* Advanced options */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Теги стиля</label>
                <Input
                  placeholder="pop, rock, energetic..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              {section.lyrics && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Текст секции (можно изменить)
                  </label>
                  <Textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                    rows={3}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>
        
        {/* Duration warning */}
        {!isValidDuration && (
          <div className="mt-3 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
            Секция слишком длинная (макс. {formatTime(maxDuration)})
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isValidDuration || replaceMutation.isPending}
          >
            {replaceMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Обработка...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Заменить
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

InlineSectionReplaceForm.displayName = 'InlineSectionReplaceForm';
