import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, Share2, Info, Trash2, Eye, EyeOff, Send,
  Scissors, Wand2, ImagePlus, FileAudio, Music2, FileText, Layers,
  Plus, Mic, Volume2, Music, Globe, Lock, ChevronDown, GitBranch, Check, Star, Users,
  ListPlus, Play, Video, Loader2, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useTrackActions } from '@/hooks/useTrackActions';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrackDetailSheet } from './TrackDetailSheet';
import { LyricsSheet } from './LyricsSheet';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { CreateArtistDialog } from './CreateArtistDialog';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoGenerationStatus } from '@/hooks/useVideoGenerationStatus';
import { useStemReferenceStore } from '@/stores/stemReferenceStore';

interface StemInfo {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface TrackActionsSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function TrackActionsSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload 
}: TrackActionsSheetProps) {
  const navigate = useNavigate();
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [addVocalsDialogOpen, setAddVocalsDialogOpen] = useState(false);
  const [addInstrumentalDialogOpen, setAddInstrumentalDialogOpen] = useState(false);
  const [createArtistDialogOpen, setCreateArtistDialogOpen] = useState(false);
  const [stemCount, setStemCount] = useState(0);
  const [stems, setStems] = useState<StemInfo[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [stemsOpen, setStemsOpen] = useState(false);
  const [versions, setVersions] = useState<Array<{
    id: string;
    version_label: string | null;
    audio_url: string;
    cover_url: string | null;
    duration_seconds: number | null;
    is_primary: boolean | null;
  }>>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isVersionSwitching, setIsVersionSwitching] = useState(false);
  
  const { 
    isProcessing, 
    handleTogglePublic, 
    handleSeparateVocals,
    handleGenerateCover,
    handleGenerateVideo,
    handleConvertToWav,
    handleShare,
    handleRemix,
    handleSendToTelegram,
  } = useTrackActions();

  const { setStemReference } = useStemReferenceStore();

  useEffect(() => {
    if (!track) return;
    
    const fetchData = async () => {
      // Fetch stems with types
      const { data: stemsData, count: stemsCount } = await supabase
        .from('track_stems')
        .select('id, stem_type, audio_url', { count: 'exact' })
        .eq('track_id', track.id);
      setStemCount(stemsCount || 0);
      setStems((stemsData || []) as StemInfo[]);

      // Fetch versions
      const { data: versionsData } = await supabase
        .from('track_versions')
        .select('id, version_label, audio_url, cover_url, duration_seconds, is_primary')
        .eq('track_id', track.id)
        .order('clip_index', { ascending: true });
      
      setVersions(versionsData || []);
      setActiveVersionId((track as any).active_version_id || versionsData?.[0]?.id || null);
    };
    
    fetchData();
  }, [track?.id]);

  const handleVersionSwitch = async (versionId: string) => {
    if (!track || versionId === activeVersionId) return;
    
    triggerHapticFeedback('light');
    setIsVersionSwitching(true);
    
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ active_version_id: versionId })
        .eq('id', track.id);
      
      if (error) throw error;
      
      setActiveVersionId(versionId);
      const version = versions.find(v => v.id === versionId);
      toast.success(`Переключено на версию ${version?.version_label || 'A'}`);
    } catch (error) {
      console.error('Error switching version:', error);
      toast.error('Ошибка переключения версии');
    } finally {
      setIsVersionSwitching(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscribeMidi = () => {
    if (!track?.audio_url) return;
    toast.info('Транскрипция в MIDI скоро будет доступна!');
    onOpenChange(false);
  };
  
  if (!track) return null;

  const { addToQueue, queue, currentIndex } = usePlayerStore();
  const { isGenerating: isVideoGenerating, hasVideo } = useVideoGenerationStatus(track?.id);

  const handleAddToQueue = () => {
    triggerHapticFeedback('light');
    addToQueue(track);
    toast.success('Добавлено в очередь');
    onOpenChange(false);
  };

  const handlePlayNext = () => {
    triggerHapticFeedback('light');
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, track);
    usePlayerStore.setState({ queue: newQueue });
    toast.success('Будет воспроизведено следующим');
    onOpenChange(false);
  };

  const hasLyrics = track.audio_url && track.status === 'completed' && (track.lyrics || (track.suno_task_id && track.suno_id));
  const isCompleted = track.audio_url && track.status === 'completed';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* T059 - Mobile-optimized bottom sheet with better touch handling */}
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[80vh] rounded-t-xl overflow-y-auto
                     /* Mobile optimizations */
                     touch-pan-y overscroll-contain
                     /* Safe area insets for notched devices */
                     pb-safe
                    "
        >
          <SheetHeader>
            <SheetTitle className="text-left">
              {track.title || 'Без названия'}
            </SheetTitle>
            {track.style && (
              <p className="text-sm text-muted-foreground text-left">
                {track.style}
              </p>
            )}
          </SheetHeader>
          
          {/* T059 - Touch-friendly button spacing (minimum 44x44px) */}
          <div className="mt-6 space-y-1">
            {/* Versions Section - Show if multiple versions exist */}
            {versions.length > 1 && (
              <>
                <Collapsible open={versionsOpen} onOpenChange={setVersionsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5" />
                        <span>Версии</span>
                        <Badge variant="secondary" className="ml-1">
                          {versions.length}
                        </Badge>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${versionsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {versions.map((version, index) => (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <Button
                          variant={version.id === activeVersionId ? 'secondary' : 'ghost'}
                          className={`w-full justify-between gap-3 h-11 transition-all duration-300 ${
                            version.id === activeVersionId 
                              ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                              : ''
                          }`}
                          onClick={() => handleVersionSwitch(version.id)}
                          disabled={isVersionSwitching}
                        >
                          <div className="flex items-center gap-2">
                            <motion.span 
                              className="font-medium"
                              animate={{ 
                                scale: version.id === activeVersionId ? 1.02 : 1,
                              }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              Версия {version.version_label || 'A'}
                            </motion.span>
                            {version.duration_seconds && (
                              <span className="text-xs text-muted-foreground">
                                ({formatDuration(version.duration_seconds)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {version.is_primary && (
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            )}
                            <AnimatePresence mode="wait">
                              {version.id === activeVersionId && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 15 
                                  }}
                                >
                                  <Check className="w-4 h-4 text-primary" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Separator className="my-2" />
              </>
            )}

            {/* Info Section */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                onOpenChange(false);
                setDetailSheetOpen(true);
              }}
            >
              <Info className="w-5 h-5" />
              <span>Детали трека</span>
            </Button>

            {hasLyrics && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  onOpenChange(false);
                  setLyricsSheetOpen(true);
                }}
              >
                <FileText className="w-5 h-5" />
                <span>Текст песни</span>
              </Button>
            )}

            {/* Queue Actions */}
            {isCompleted && (
              <>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={handleAddToQueue}
                >
                  <ListPlus className="w-5 h-5" />
                  <span>Добавить в очередь</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={handlePlayNext}
                >
                  <Play className="w-5 h-5" />
                  <span>Воспроизвести следующим</span>
                </Button>
                
                {/* Watch Video - Show if video exists */}
                {hasVideo && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      onOpenChange(false);
                      setDetailSheetOpen(true);
                    }}
                  >
                    <Video className="w-5 h-5 text-green-500" />
                    <span>Смотреть видео</span>
                    <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-600">
                      Готово
                    </Badge>
                  </Button>
                )}
              </>
            )}

            {stemCount > 0 && (
              <>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/studio/${track.id}`);
                  }}
                >
                  <Layers className="w-5 h-5" />
                  <span>Открыть в студии</span>
                  <span className="ml-auto text-xs text-muted-foreground">{stemCount} стемов</span>
                </Button>

                {/* Stem Actions Section - show specific actions based on stem types */}
                <Collapsible open={stemsOpen} onOpenChange={setStemsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <Wand2 className="w-5 h-5" />
                        <span>Действия со стемами</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${stemsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {stems.map((stem) => {
                      const isVocal = stem.stem_type === 'vocal' || stem.stem_type === 'vocals';
                      const isInstrumental = stem.stem_type === 'instrumental' || 
                        stem.stem_type === 'backing' || 
                        stem.stem_type === 'accompaniment';
                      
                      const stemLabel = isVocal ? 'Вокал' : 
                        isInstrumental ? 'Инструментал' : 
                        stem.stem_type.charAt(0).toUpperCase() + stem.stem_type.slice(1);
                      
                      const actionLabel = isVocal ? 'Новая аранжировка' : 
                        isInstrumental ? 'Наложить вокал' : 
                        'Использовать';
                      
                      return (
                        <Button
                          key={stem.id}
                          variant="ghost"
                          className="w-full justify-between gap-3 h-11"
                          onClick={() => {
                            // Set stem as reference for generation
                            setStemReference({
                              url: stem.audio_url,
                              name: `${track.title || 'Трек'} - ${stemLabel}`,
                              type: stem.stem_type,
                              trackId: track.id,
                              trackTitle: track.title || undefined,
                              trackLyrics: track.lyrics || undefined,
                              trackStyle: track.style || undefined,
                            });
                            onOpenChange(false);
                            navigate('/');
                            toast.success(`${stemLabel} выбран для генерации`);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {isVocal ? <Mic className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            <span>{stemLabel}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {isCompleted && (
              <>
                <Separator className="my-2" />
                
                {/* Edit Section - Collapsible */}
                <Collapsible open={editOpen} onOpenChange={setEditOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5" />
                        <span>Редактировать</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${editOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => {
                        onOpenChange(false);
                        setExtendDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Расширить</span>
                    </Button>

                    {/* Show "Add vocals" for instrumental tracks OR if has instrumental stem */}
                    {(track.is_instrumental === true || track.has_vocals === false || 
                      stems.some(s => s.stem_type === 'instrumental' || s.stem_type === 'backing' || s.stem_type === 'accompaniment')) && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={() => {
                          onOpenChange(false);
                          setAddVocalsDialogOpen(true);
                        }}
                      >
                        <Mic className="w-4 h-4" />
                        <span>Добавить вокал</span>
                      </Button>
                    )}

                    {/* Show "New arrangement" if has vocal stem */}
                    {stems.some(s => s.stem_type === 'vocal' || s.stem_type === 'vocals') && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={() => {
                          onOpenChange(false);
                          setAddInstrumentalDialogOpen(true);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Новая аранжировка</span>
                      </Button>
                    )}

                    {/* Show "Add instrumental" for tracks with vocals but no stems */}
                    {track.has_vocals === true && stemCount === 0 && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={() => {
                          onOpenChange(false);
                          setAddInstrumentalDialogOpen(true);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Добавить инструментал</span>
                      </Button>
                    )}

                    {track.suno_id && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={async () => {
                          await handleRemix(track);
                          onOpenChange(false);
                        }}
                        disabled={isProcessing}
                      >
                        <Music className="w-4 h-4" />
                        <span>Ремикс</span>
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Processing Section - Collapsible */}
                <Collapsible open={processOpen} onOpenChange={setProcessOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <Wand2 className="w-5 h-5" />
                        <span>Обработка</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${processOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {/* Stem separation - only show if track doesn't have stems yet */}
                    {track.suno_id && stemCount === 0 && (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-11"
                          onClick={async () => {
                            await handleSeparateVocals(track, 'simple');
                            onOpenChange(false);
                          }}
                          disabled={isProcessing}
                        >
                          <Scissors className="w-4 h-4" />
                          <span>Стемы (простое)</span>
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-11"
                          onClick={async () => {
                            await handleSeparateVocals(track, 'detailed');
                            onOpenChange(false);
                          }}
                          disabled={isProcessing}
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>Стемы (детальное)</span>
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={async () => {
                        await handleGenerateCover(track);
                        onOpenChange(false);
                      }}
                      disabled={isProcessing}
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Обложка</span>
                    </Button>

                    {track.suno_id && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={async () => {
                          await handleConvertToWav(track);
                          onOpenChange(false);
                        }}
                        disabled={isProcessing}
                      >
                        <FileAudio className="w-4 h-4" />
                        <span>WAV формат</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={handleTranscribeMidi}
                      disabled={isProcessing}
                    >
                      <Music2 className="w-4 h-4" />
                      <span>MIDI файл</span>
                    </Button>

                    {track.suno_id && track.suno_task_id && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={async () => {
                          await handleGenerateVideo(track);
                          onOpenChange(false);
                        }}
                        disabled={isProcessing || isVideoGenerating || hasVideo}
                      >
                        {isVideoGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Видео создаётся...</span>
                          </>
                        ) : hasVideo ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Видео готово</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            <span>Создать видеоклип</span>
                          </>
                        )}
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />

                {/* Share Section */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    onDownload?.();
                    onOpenChange(false);
                  }}
                >
                  <Download className="w-5 h-5" />
                  <span>Скачать</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleShare(track);
                    onOpenChange(false);
                  }}
                >
                  <Share2 className="w-5 h-5" />
                  <span>Поделиться</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleSendToTelegram(track);
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                >
                  <Send className="w-5 h-5" />
                  <span>Отправить в Telegram</span>
                </Button>

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleTogglePublic(track);
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                >
                  {track.is_public ? (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Сделать приватным</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      <span>Сделать публичным</span>
                    </>
                  )}
                </Button>

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    onOpenChange(false);
                    setCreateArtistDialogOpen(true);
                  }}
                >
                  <Users className="w-5 h-5" />
                  <span>Создать артиста</span>
                </Button>
              </>
            )}

            <Separator className="my-2" />
            
            {/* Delete */}
            {onDelete && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-5 h-5" />
                <span>Удалить</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TrackDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        track={track}
      />

      <LyricsSheet
        open={lyricsSheetOpen}
        onOpenChange={setLyricsSheetOpen}
        track={track}
      />

      <ExtendTrackDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        track={track}
      />

      <AddVocalsDialog
        open={addVocalsDialogOpen}
        onOpenChange={setAddVocalsDialogOpen}
        track={track}
      />

      <AddInstrumentalDialog
        open={addInstrumentalDialogOpen}
        onOpenChange={setAddInstrumentalDialogOpen}
        track={track}
      />

      <CreateArtistDialog
        open={createArtistDialogOpen}
        onOpenChange={setCreateArtistDialogOpen}
        fromTrack={{
          title: track.title,
          style: track.style,
          tags: track.tags,
          cover_url: track.cover_url,
        }}
      />
    </>
  );
}