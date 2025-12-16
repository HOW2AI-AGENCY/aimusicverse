import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Square, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { usePromptDJ } from '@/hooks/usePromptDJ';
import { ChannelCard } from './ChannelCard';
import { StyleCrossfader } from './StyleCrossfader';
import { ControlPanel } from './ControlPanel';
import { LiveVisualizer } from './LiveVisualizer';
import { cn } from '@/lib/utils';

export function PromptDJMidi() {
  const {
    channels,
    updateChannel,
    crossfaderPosition,
    setCrossfaderPosition,
    globalSettings,
    updateGlobalSettings,
    isGenerating,
    generatedTracks,
    generateMusic,
    isPlaying,
    currentTrack,
    playTrack,
    stopPlayback,
    previewPrompt,
    stopPreview,
    isPreviewPlaying,
    currentPrompt,
    analyzerNode,
  } = usePromptDJ();

  return (
    <div className="space-y-4">
      {/* Header with visualizer */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-background to-blue-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-400" />
            PromptDJ MIDI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visualizer */}
          <LiveVisualizer
            analyzerNode={analyzerNode}
            isActive={isPlaying || isPreviewPlaying}
            className="h-20"
          />
          
          {/* Current prompt preview */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Текущий промпт:</p>
            <p className="text-sm font-medium line-clamp-2">
              {currentPrompt || 'Настройте каналы микшера...'}
            </p>
          </div>

          {/* Transport controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={isPreviewPlaying ? stopPreview : previewPrompt}
              disabled={isGenerating}
            >
              {isPreviewPlaying ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Стоп
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Превью
                </>
              )}
            </Button>
            
            <Button
              onClick={generateMusic}
              disabled={isGenerating || !currentPrompt}
              className="min-w-32"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Сгенерировать
                </>
              )}
            </Button>
            
            {isPlaying && (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopPlayback}
              >
                <Square className="h-4 w-4 mr-2" />
                Стоп
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Channels grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onUpdate={(updates) => updateChannel(channel.id, updates)}
          />
        ))}
      </div>

      {/* Crossfader */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <StyleCrossfader
            position={crossfaderPosition}
            onChange={setCrossfaderPosition}
            disabled={isGenerating}
          />
        </CardContent>
      </Card>

      {/* Control panel */}
      <ControlPanel
        settings={globalSettings}
        onUpdate={updateGlobalSettings}
      />

      {/* Generated tracks history */}
      {generatedTracks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">История ({generatedTracks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-48">
              <div className="p-3 space-y-2">
                {generatedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg',
                      'bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer',
                      currentTrack?.id === track.id && 'ring-1 ring-primary'
                    )}
                    onClick={() => playTrack(track)}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-xs text-muted-foreground truncate">
                        {track.prompt}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {track.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentTrack?.id === track.id && isPlaying) {
                          stopPlayback();
                        } else {
                          playTrack(track);
                        }
                      }}
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
