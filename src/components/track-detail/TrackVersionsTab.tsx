import { memo, useState, useRef, useEffect } from "react";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music2, Clock, Play, Pause, Download, Check, Trash2, Plus } from "@/lib/icons";
import { format, ru } from "@/lib/date-utils";
import { useTrackVersionManagement } from "@/hooks/useTrackVersionManagement";
import { fetchTrackById } from "@/api/tracks.api";
import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/track";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { formatTime } from "@/lib/formatters";
import { LazyImage } from "@/components/ui/lazy-image";

interface VersionMetadata {
  prompt?: string;
  style?: string | null;
  tags?: string | null;
  title?: string;
  model_name?: string;
  suno_id?: string;
  clip_index?: number;
  local_storage?: boolean;
}

interface TrackVersionsTabProps {
  trackId: string;
}

export function TrackVersionsTab({ trackId }: TrackVersionsTabProps) {
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { isProcessing, createVersionFromTrack, setVersionAsPrimary, deleteVersion } = useTrackVersionManagement();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceId = `versions-tab-${trackId}`;

  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  // Register with studio audio coordinator
  useEffect(() => {
    registerStudioAudio(sourceId, () => {
      audioRef.current?.pause();
      setPlayingId(null);
    });

    return () => {
      unregisterStudioAudio(sourceId);
      audioRef.current?.pause();
    };
  }, [sourceId]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && playingId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
  }, [globalIsPlaying, playingId]);

  // Fetch main track data
  const { data: mainTrack } = useQuery({
    queryKey: ["track", trackId],
    queryFn: async () => {
      const data = await fetchTrackById(trackId);
      if (!data) throw new Error("Track not found");
      return {
        ...data,
        likes_count: 0,
        is_liked: false,
      } as Track;
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    return formatTime(seconds);
  };

  const getVersionLabel = (type: string | null) => {
    if (!type) return "Версия";
    const labels: Record<string, string> = {
      current: "Текущая версия",
      initial: "Оригинал",
      original: "Оригинал",
      alternative: "Альтернатива",
      remix: "Ремикс",
      extend: "Продление",
      cover: "Кавер",
      instrumental: "Инструментал",
      vocal: "Вокал добавлен",
    };
    return labels[type] || type;
  };

  // Helper to safely parse metadata
  const parseMetadata = (metadata: unknown): VersionMetadata | null => {
    if (!metadata || typeof metadata !== "object") return null;
    return metadata as VersionMetadata;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Combine main track with versions
  const allVersions = [
    ...(mainTrack
      ? [
          {
            id: mainTrack.id,
            track_id: mainTrack.id,
            audio_url: mainTrack.audio_url || "",
            cover_url: mainTrack.cover_url,
            duration_seconds: mainTrack.duration_seconds,
            version_type: "current" as const,
            is_primary: true,
            parent_version_id: null,
            metadata: {
              prompt: mainTrack.prompt,
              style: mainTrack.style,
              tags: mainTrack.tags,
            } as VersionMetadata,
            created_at: mainTrack.created_at,
          },
        ]
      : []),
    ...(versions || []).map((v) => ({
      ...v,
      version_type: v.version_type || "initial",
      metadata: parseMetadata(v.metadata),
    })),
  ];

  if (!allVersions || allVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Версии отсутствуют</p>
      </div>
    );
  }

  const handlePlayVersion = (versionId: string, audioUrl: string) => {
    if (playingId === versionId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop current playback
    audioRef.current?.pause();

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(sourceId);

    // Play this version
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(versionId);
  };

  return (
    <div className="relative">
      {/* Action buttons */}
      {mainTrack && (
        <div className="mb-6 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => createVersionFromTrack(mainTrack)} disabled={isProcessing}>
            <Plus className="w-4 h-4 mr-2" />
            Создать версию из текущего трека
          </Button>
        </div>
      )}

      {/* Timeline line */}
      <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

      <div className="space-y-6">
        {allVersions.map((version, index) => {
          const meta = version.metadata;

          return (
            <div key={version.id} className="relative pl-16 group">
              {/* Timeline dot */}
              <div
                className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 transition-all ${
                  version.is_primary
                    ? "bg-primary border-primary shadow-lg shadow-primary/50"
                    : "bg-background border-primary/50 group-hover:border-primary"
                }`}
              />

              {/* Version card */}
              <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {version.cover_url ? (
                      <LazyImage
                        src={version.cover_url}
                        alt="Version cover"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Music2 className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={version.is_primary ? "default" : "secondary"}>
                          {getVersionLabel(version.version_type)}
                        </Badge>
                        {version.is_primary && (
                          <Badge variant="outline" className="border-primary text-primary">
                            Текущая
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {version.created_at &&
                          format(new Date(version.created_at), "dd MMM yyyy, HH:mm", {
                            locale: ru,
                          })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDuration(version.duration_seconds)}</span>
                  </div>
                </div>

                {/* Metadata */}
                {meta && (
                  <div className="mb-3 space-y-2">
                    {meta.title && version.version_type !== "current" && (
                      <div className="flex items-center gap-2">
                        <Music2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{meta.title}</span>
                      </div>
                    )}

                    {meta.tags && (
                      <div className="flex flex-wrap gap-1">
                        {meta.tags
                          .split(",")
                          .slice(0, 5)
                          .map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                      </div>
                    )}

                    {(meta.model_name || meta.suno_id) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {meta.model_name && <span>🤖 {meta.model_name}</span>}
                        {meta.suno_id && <span className="font-mono">ID: {meta.suno_id.substring(0, 8)}...</span>}
                        {meta.clip_index !== undefined && <span>Клип #{meta.clip_index + 1}</span>}
                      </div>
                    )}

                    {meta.local_storage && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span>Сохранено локально</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={playingId === version.id ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handlePlayVersion(version.id, version.audio_url)}
                  >
                    {playingId === version.id ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {playingId === version.id ? "Пауза" : "Прослушать"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(version.audio_url, "_blank")}>
                    <Download className="w-3 h-3" />
                  </Button>

                  {!version.is_primary && version.version_type !== "current" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setVersionAsPrimary(version.id, trackId)}
                        disabled={isProcessing}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Сделать текущей
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteVersion(version.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Connection line to parent */}
              {version.parent_version_id && index > 0 && (
                <div className="absolute left-6 top-0 w-10 h-6 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
