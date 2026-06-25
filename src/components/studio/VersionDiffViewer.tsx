/**
 * Version Diff Viewer
 * 
 * Visual comparison between two track versions with waveform overlay
 * and metadata diff display.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  GitCompare, 
  Play, 
  Pause, 
  SkipBack,
  Clock,
  Music,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/formatters';

interface TrackVersion {
  id: string;
  version_label: string;
  audio_url: string;
  duration_seconds?: number | null;
  version_type?: string | null;
  created_at: string;
  is_primary: boolean;
  metadata?: Record<string, unknown> | null;
}

interface VersionDiffViewerProps {
  versions: TrackVersion[];
  onClose?: () => void;
}

interface WaveformData {
  peaks: number[];
}

function SimpleWaveform({ 
  audioUrl, 
  color, 
  opacity = 1,
  height = 80,
}: { 
  audioUrl: string; 
  color: string;
  opacity?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);

  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(channelData.length / samples);
        const peaks: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j] || 0);
          }
          peaks.push(sum / blockSize);
        }
        
        // Normalize
        const max = Math.max(...peaks);
        const normalized = peaks.map(p => p / max);
        
        setWaveformData({ peaks: normalized });
        audioContext.close();
      } catch (error) {
        logger.error('Failed to generate waveform:', { error });
      }
    };

    generateWaveform();
  }, [audioUrl]);

  useEffect(() => {
    if (!waveformData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const barWidth = rect.width / waveformData.peaks.length;
    const centerY = rect.height / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    waveformData.peaks.forEach((peak, i) => {
      const barHeight = peak * centerY * 0.9;
      const x = i * barWidth;
      
      // Draw mirrored bars
      ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
    });
  }, [waveformData, color, opacity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full" 
      style={{ height }}
    />
  );
}

function MetadataDiff({ 
  versionA, 
  versionB 
}: { 
  versionA: TrackVersion; 
  versionB: TrackVersion;
}) {
  const diffs = useMemo(() => {
    const changes: Array<{ key: string; a: string; b: string; changed: boolean }> = [];
    
    // Duration
    const durA = versionA.duration_seconds 
      ? formatDuration(versionA.duration_seconds) 
      : 'N/A';
    const durB = versionB.duration_seconds 
      ? formatDuration(versionB.duration_seconds) 
      : 'N/A';
    changes.push({ 
      key: 'Длительность', 
      a: durA, 
      b: durB, 
      changed: durA !== durB 
    });

    // Version type
    const typeA = versionA.version_type || 'original';
    const typeB = versionB.version_type || 'original';
    changes.push({ 
      key: 'Тип', 
      a: typeA, 
      b: typeB, 
      changed: typeA !== typeB 
    });

    // Created at
    const dateA = new Date(versionA.created_at).toLocaleDateString('ru-RU');
    const dateB = new Date(versionB.created_at).toLocaleDateString('ru-RU');
    changes.push({ 
      key: 'Создано', 
      a: dateA, 
      b: dateB, 
      changed: dateA !== dateB 
    });

    return changes;
  }, [versionA, versionB]);

  return (
    <div className="space-y-1 text-xs">
      {diffs.map(diff => (
        <div 
          key={diff.key} 
          className={cn(
            'flex items-center justify-between p-1 rounded',
            diff.changed && 'bg-yellow-500/10'
          )}
        >
          <span className="text-muted-foreground">{diff.key}:</span>
          <div className="flex gap-2">
            <span className={cn(diff.changed && 'text-blue-500')}>{diff.a}</span>
            {diff.changed && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="text-green-500">{diff.b}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function VersionDiffViewer({ versions, onClose }: VersionDiffViewerProps) {
  const [versionAId, setVersionAId] = useState<string>(versions[1]?.id || versions[0]?.id);
  const [versionBId, setVersionBId] = useState<string>(versions[0]?.id);
  const [overlayMode, setOverlayMode] = useState(true);
  const [playingVersion, setPlayingVersion] = useState<'A' | 'B' | null>(null);
  const [aOpacity, setAOpacity] = useState([0.5]);
  
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const versionA = versions.find(v => v.id === versionAId);
  const versionB = versions.find(v => v.id === versionBId);

  const handlePlay = (version: 'A' | 'B') => {
    const audioRef = version === 'A' ? audioRefA : audioRefB;
    const otherRef = version === 'A' ? audioRefB : audioRefA;
    
    if (playingVersion === version) {
      audioRef.current?.pause();
      setPlayingVersion(null);
    } else {
      otherRef.current?.pause();
      audioRef.current?.play();
      setPlayingVersion(version);
    }
  };

  const handleSeekToStart = () => {
    if (audioRefA.current) audioRefA.current.currentTime = 0;
    if (audioRefB.current) audioRefB.current.currentTime = 0;
  };

  if (versions.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Необходимо минимум 2 версии для сравнения</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Сравнение версий
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-blue-500">Версия A (было)</Label>
            <Select value={versionAId} onValueChange={setVersionAId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.filter(v => v.id !== versionBId).map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version_label} {v.is_primary && '(основная)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-500">Версия B (стало)</Label>
            <Select value={versionBId} onValueChange={setVersionBId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.filter(v => v.id !== versionAId).map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version_label} {v.is_primary && '(основная)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="overlay-mode"
                checked={overlayMode} 
                onCheckedChange={setOverlayMode}
              />
              <Label htmlFor="overlay-mode" className="text-sm">
                Наложение
              </Label>
            </div>
            
            {overlayMode && (
              <div className="flex items-center gap-2 w-32">
                <Label className="text-xs text-muted-foreground">A:</Label>
                <Slider
                  value={aOpacity}
                  onValueChange={setAOpacity}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSeekToStart}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant={playingVersion === 'A' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlay('A')}
              className="gap-1"
            >
              {playingVersion === 'A' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="text-blue-500">A</span>
            </Button>
            <Button
              variant={playingVersion === 'B' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlay('B')}
              className="gap-1"
            >
              {playingVersion === 'B' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="text-green-500">B</span>
            </Button>
          </div>
        </div>

        {/* Waveform comparison */}
        <div className="relative bg-muted rounded-lg p-2">
          {overlayMode ? (
            <div className="relative h-20">
              {versionA && (
                <div className="absolute inset-0">
                  <SimpleWaveform 
                    audioUrl={versionA.audio_url} 
                    color="hsl(217, 91%, 60%)"
                    opacity={aOpacity[0]}
                  />
                </div>
              )}
              {versionB && (
                <div className="absolute inset-0">
                  <SimpleWaveform 
                    audioUrl={versionB.audio_url} 
                    color="hsl(142, 71%, 45%)"
                    opacity={1 - aOpacity[0]}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {versionA && (
                <div>
                  <Badge variant="outline" className="mb-1 text-blue-500">A: {versionA.version_label}</Badge>
                  <SimpleWaveform 
                    audioUrl={versionA.audio_url} 
                    color="hsl(217, 91%, 60%)"
                    height={50}
                  />
                </div>
              )}
              {versionB && (
                <div>
                  <Badge variant="outline" className="mb-1 text-green-500">B: {versionB.version_label}</Badge>
                  <SimpleWaveform 
                    audioUrl={versionB.audio_url} 
                    color="hsl(142, 71%, 45%)"
                    height={50}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata diff */}
        {versionA && versionB && (
          <div className="border rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Изменения метаданных
            </h4>
            <MetadataDiff versionA={versionA} versionB={versionB} />
          </div>
        )}

        {/* Hidden audio elements */}
        {versionA && (
          <audio 
            ref={audioRefA} 
            src={versionA.audio_url}
            onEnded={() => setPlayingVersion(null)}
          />
        )}
        {versionB && (
          <audio 
            ref={audioRefB} 
            src={versionB.audio_url}
            onEnded={() => setPlayingVersion(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
