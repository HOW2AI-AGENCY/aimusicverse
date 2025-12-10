import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Music, Mic, Volume2, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { cn } from '@/lib/utils';

interface TrackDetailsTabProps {
  track: Track;
}

const PROMPT_PREVIEW_LENGTH = 150; // символов для preview

export function TrackDetailsTab({ track }: TrackDetailsTabProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const isMobile = useIsMobile();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  // 📱 Progressive Disclosure для промпта
  const isLongPrompt = (track.prompt?.length || 0) > PROMPT_PREVIEW_LENGTH;
  const shouldCollapsePrompt = isMobile && isLongPrompt;
  const promptPreview = shouldCollapsePrompt && !isPromptExpanded
    ? `${track.prompt?.slice(0, PROMPT_PREVIEW_LENGTH)}...`
    : track.prompt;

  const handleTogglePrompt = () => {
    hapticImpact('light');
    setIsPromptExpanded(!isPromptExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Cover and Title */}
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={track.cover_url || '/placeholder-cover.png'}
          alt={track.title || 'Track cover'}
          className="w-full md:w-48 h-48 object-cover rounded-lg shadow-md"
        />
        
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{track.title || 'Untitled'}</h2>
            <div className="flex flex-wrap gap-2">
              {track.has_vocals && (
                <Badge variant="secondary" className="gap-1">
                  <Mic className="w-3 h-3" />
                  Vocal
                </Badge>
              )}
              {!track.has_vocals && (
                <Badge variant="secondary" className="gap-1">
                  <Music className="w-3 h-3" />
                  Instrumental
                </Badge>
              )}
              {track.suno_model && (
                <Badge variant="outline">
                  {track.suno_model}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Music className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Style</p>
              <p className="font-medium">{track.style || 'Not specified'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{formatDuration(track.duration_seconds)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(track.created_at)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Play Count</p>
              <p className="font-medium">{track.play_count || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tags */}
      {track.tags && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {track.tags.split(',').map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Prompt с Progressive Disclosure */}
      {track.prompt && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Prompt</h3>
          <div className="relative">
            <motion.p
              className={cn(
                "text-sm text-muted-foreground whitespace-pre-wrap",
                shouldCollapsePrompt && !isPromptExpanded && "line-clamp-3"
              )}
              initial={false}
              animate={{
                maxHeight: shouldCollapsePrompt && !isPromptExpanded ? '4.5rem' : 'none'
              }}
              transition={{ duration: 0.3 }}
            >
              {promptPreview}
            </motion.p>

            {/* Кнопка Показать полностью / Свернуть для промпта */}
            {shouldCollapsePrompt && (
              <div className="mt-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTogglePrompt}
                  className="gap-1 text-xs touch-manipulation text-primary hover:text-primary/80"
                >
                  {isPromptExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Свернуть
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Показать полностью
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
