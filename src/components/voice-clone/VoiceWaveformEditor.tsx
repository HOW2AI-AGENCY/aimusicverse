/**
 * VoiceWaveformEditor — waveform visualization with trim handles and preview player.
 *
 * Two modes:
 *  - live: shows real-time level from MediaStream (during recording)
 *  - static: shows full waveform from Blob, with trim handles + play controls
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "@/lib/icons";
import { generateWaveformFromBuffer } from "@/lib/waveformGenerator";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface LiveProps {
  mode: "live";
  stream: MediaStream | null;
  height?: number;
}

interface StaticProps {
  mode: "static";
  blob: Blob;
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
  minSegmentS?: number;
  maxSegmentS?: number;
  height?: number;
}

type Props = LiveProps | StaticProps;

export function VoiceWaveformEditor(props: Props) {
  if (props.mode === "live") return <LiveWaveform stream={props.stream} height={props.height ?? 96} />;
  return <StaticWaveform {...props} height={props.height ?? 96} />;
}

/* ---------------- LIVE (recording) ---------------- */

function LiveWaveform({ stream, height }: { stream: MediaStream | null; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (!stream) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    historyRef.current = [];

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      historyRef.current.push(Math.min(1, rms * 2.5));
      const w = canvas.width;
      const h = canvas.height;
      const barW = 3;
      const gap = 2;
      const maxBars = Math.floor(w / (barW + gap));
      if (historyRef.current.length > maxBars) historyRef.current = historyRef.current.slice(-maxBars);
      const g = canvas.getContext("2d");
      if (!g) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      g.clearRect(0, 0, w, h);
      g.fillStyle = "hsl(var(--foreground) / 0.7)";
      historyRef.current.forEach((v, i) => {
        const barH = Math.max(2, v * h * 0.85);
        const y = (h - barH) / 2;
        const x = w - (historyRef.current.length - i) * (barW + gap);
        g.fillRect(x, y, barW, barH);
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        src.disconnect();
      } catch {
        /* ignore */
      }
      void ctx.close().catch(() => {});
    };
  }, [stream]);

  return (
    <div
      className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden"
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
}

/* ---------------- STATIC (playback + trim) ---------------- */

function StaticWaveform({
  blob,
  duration,
  trimStart,
  trimEnd,
  onTrimChange,
  minSegmentS = 5,
  maxSegmentS = 30,
  height,
}: Omit<StaticProps, "mode"> & { height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [width, setWidth] = useState(320);

  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const { isPlaying, play, pause, seek, audioRef } = usePreviewAudio({
    id: `voice-trim-preview-${url}`,
    src: url,
    priority: AudioPriority.LOW,
  });
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      setCurrentTime(el.currentTime);
      // Loop within trim range
      if (isPlaying && el.currentTime >= trimEnd) {
        el.currentTime = trimStart;
      }
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [audioRef, isPlaying, trimStart, trimEnd]);

  // Resize observer for responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Generate waveform peaks once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const buf = await blob.arrayBuffer();
        const res = await generateWaveformFromBuffer(buf, { samples: 200, normalize: true });
        if (!cancelled) setPeaks(res.peaks);
      } catch (e) {
        logger.warn("waveform generation failed", { err: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const cursorPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Drag logic for handles
  const dragRef = useRef<"start" | "end" | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const t = pct * duration;
      if (dragRef.current === "start") {
        const clampedMax = Math.max(0, trimEnd - minSegmentS);
        const clampedMin = Math.max(0, trimEnd - maxSegmentS);
        onTrimChange(Math.max(clampedMin, Math.min(clampedMax, t)), trimEnd);
      } else {
        const clampedMin = Math.min(duration, trimStart + minSegmentS);
        const clampedMax = Math.min(duration, trimStart + maxSegmentS);
        onTrimChange(trimStart, Math.max(clampedMin, Math.min(clampedMax, t)));
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [duration, trimStart, trimEnd, minSegmentS, maxSegmentS, onTrimChange]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      seek(trimStart);
      void play();
    }
  }, [isPlaying, pause, play, seek, trimStart]);

  const segSec = Math.max(0, trimEnd - trimStart);

  return (
    <div className="space-y-2.5">
      {/* Waveform + handles */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-border/50 bg-muted/20 overflow-hidden select-none"
        style={{ height }}
      >
        {/* Peaks */}
        <svg width={width} height={height} className="absolute inset-0 w-full h-full block">
          {peaks.map((p, i) => {
            const x = (i / peaks.length) * width;
            const barW = Math.max(1, width / peaks.length - 1);
            const barH = Math.max(2, p * height * 0.85);
            const y = (height - barH) / 2;
            const pct = (i / peaks.length) * 100;
            const inRange = pct >= startPct && pct <= endPct;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={1}
                fill={inRange ? "hsl(var(--foreground) / 0.85)" : "hsl(var(--foreground) / 0.2)"}
              />
            );
          })}
        </svg>

        {/* Out-of-range dim overlays */}
        <div className="absolute inset-y-0 left-0 bg-background/50" style={{ width: `${startPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-background/50" style={{ width: `${100 - endPct}%` }} />

        {/* Playhead */}
        {isPlaying && (
          <div
            className="absolute inset-y-0 w-px bg-primary/90 pointer-events-none"
            style={{ left: `${cursorPct}%` }}
          />
        )}

        {/* Start handle */}
        <div
          role="slider"
          aria-label="Начало сегмента"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={trimStart}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            dragRef.current = "start";
          }}
          className="absolute top-0 h-full w-11 -ml-5 flex items-center justify-center cursor-ew-resize touch-none"
          style={{ left: `${startPct}%` }}
        >
          <div className="w-1 h-full bg-foreground rounded-full" />
        </div>

        {/* End handle */}
        <div
          role="slider"
          aria-label="Конец сегмента"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={trimEnd}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            dragRef.current = "end";
          }}
          className="absolute top-0 h-full w-11 -ml-6 flex items-center justify-center cursor-ew-resize touch-none"
          style={{ left: `${endPct}%` }}
        >
          <div className="w-1 h-full bg-foreground rounded-full" />
        </div>
      </div>

      {/* Player + range info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? "Пауза" : "Прослушать сегмент"}
          className={cn(
            "shrink-0 w-11 h-11 rounded-full border border-border/50 bg-background",
            "flex items-center justify-center hover:bg-muted active:scale-95 transition-all",
          )}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="flex-1 text-xs text-muted-foreground font-mono">
          <span className="text-foreground font-semibold">{trimStart.toFixed(1)}с</span>
          {" — "}
          <span className="text-foreground font-semibold">{trimEnd.toFixed(1)}с</span>
          <span className="ml-2 opacity-70">({segSec.toFixed(1)}с)</span>
        </div>
      </div>
    </div>
  );
}
