/**
 * NoteFlowVisualization - Vertical flowing notes (Guitar Hero style)
 * Real-time visualization of notes synchronized with audio
 */

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Note {
  time: number;
  pitch: number;
  duration: number;
  velocity: number;
  string?: number;
}

interface NoteFlowVisualizationProps {
  notes: Note[];
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
  windowSize?: number; // Seconds visible
  onNoteHit?: (note: Note) => void;
}

// String colors for guitar visualization
const stringColors = [
  'hsl(0, 80%, 60%)',    // E - Red
  'hsl(30, 80%, 60%)',   // A - Orange
  'hsl(60, 80%, 60%)',   // D - Yellow
  'hsl(120, 60%, 50%)',  // G - Green
  'hsl(200, 80%, 60%)',  // B - Blue
  'hsl(280, 70%, 60%)',  // E - Purple
];

// Pitch to string mapping (simplified)
function pitchToString(pitch: number): number {
  // Map MIDI pitch to guitar string (0-5)
  const openStrings = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
  let closestString = 0;
  let minDiff = Math.abs(pitch - openStrings[0]);
  
  for (let i = 1; i < openStrings.length; i++) {
    const diff = Math.abs(pitch - openStrings[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestString = i;
    }
  }
  
  return closestString;
}

export const NoteFlowVisualization = memo(function NoteFlowVisualization({
  notes,
  currentTime,
  duration,
  isPlaying = false,
  windowSize = 4,
  onNoteHit,
}: NoteFlowVisualizationProps) {
  const haptic = useHapticFeedback();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastHitNoteRef = useRef<Note | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 400 });
  const [hitNotes, setHitNotes] = useState<Set<string>>(new Set());

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Check for note hits
  useEffect(() => {
    const tolerance = 0.1; // 100ms tolerance
    
    notes.forEach(note => {
      const noteKey = `${note.time}-${note.pitch}`;
      if (
        currentTime >= note.time - tolerance &&
        currentTime <= note.time + tolerance &&
        !hitNotes.has(noteKey) &&
        lastHitNoteRef.current !== note
      ) {
        lastHitNoteRef.current = note;
        setHitNotes(prev => new Set([...prev, noteKey]));
        onNoteHit?.(note);
        haptic.impact('light');
      }
    });
  }, [currentTime, notes, hitNotes, onNoteHit, trigger]);

  // Clear hit notes when seeking backwards
  useEffect(() => {
    if (!isPlaying) {
      setHitNotes(new Set());
      lastHitNoteRef.current = null;
    }
  }, [isPlaying]);

  // Draw visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'hsl(var(--background))');
    bgGradient.addColorStop(1, 'hsl(var(--muted) / 0.5)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw string lanes
    const laneWidth = width / 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `${stringColors[i].replace(')', ', 0.1)').replace('hsl', 'hsla')}`;
      ctx.fillRect(i * laneWidth, 0, laneWidth, height);
      
      // Lane divider
      ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((i + 1) * laneWidth, 0);
      ctx.lineTo((i + 1) * laneWidth, height);
      ctx.stroke();
    }

    // Hit line
    const hitLineY = height * 0.85;
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(width, hitLineY);
    ctx.stroke();

    // Glow effect on hit line
    ctx.shadowColor = 'hsl(var(--primary))';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'hsl(var(--primary) / 0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(width, hitLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw notes
    const windowStart = currentTime - windowSize * 0.15;
    const windowEnd = currentTime + windowSize * 0.85;

    notes.forEach(note => {
      if (note.time < windowStart || note.time > windowEnd) return;

      const stringIndex = note.string ?? pitchToString(note.pitch);
      const noteKey = `${note.time}-${note.pitch}`;
      const isHit = hitNotes.has(noteKey);
      
      // Calculate position
      const progress = (note.time - windowStart) / windowSize;
      const y = (1 - progress) * height;
      const x = stringIndex * laneWidth + laneWidth / 2;
      
      // Note size based on velocity
      const baseSize = Math.min(laneWidth * 0.6, 40);
      const size = baseSize * (0.7 + note.velocity * 0.3);
      
      // Duration tail
      const tailLength = (note.duration / windowSize) * height;
      if (tailLength > size / 2) {
        ctx.fillStyle = `${stringColors[stringIndex].replace(')', ', 0.3)').replace('hsl', 'hsla')}`;
        ctx.beginPath();
        ctx.roundRect(x - size / 4, y, size / 2, tailLength, 4);
        ctx.fill();
      }

      // Note head
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      
      if (isHit) {
        // Hit effect - bright glow
        ctx.shadowColor = stringColors[stringIndex];
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
      } else {
        // Normal note
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, stringColors[stringIndex]);
        gradient.addColorStop(1, stringColors[stringIndex].replace('60%', '40%'));
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = stringColors[stringIndex];
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw beat markers
    const bpm = 120; // Estimate or get from analysis
    const beatInterval = 60 / bpm;
    const firstBeat = Math.ceil(windowStart / beatInterval) * beatInterval;
    
    for (let beat = firstBeat; beat < windowEnd; beat += beatInterval) {
      const progress = (beat - windowStart) / windowSize;
      const y = (1 - progress) * height;
      
      ctx.strokeStyle = 'hsl(var(--foreground) / 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [dimensions, notes, currentTime, windowSize, hitNotes]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        className="rounded-xl"
      />

      {/* String labels */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-around px-2">
        {['E', 'A', 'D', 'G', 'B', 'e'].map((string, i) => (
          <span
            key={string}
            className="text-xs font-mono font-bold opacity-60"
            style={{ color: stringColors[i] }}
          >
            {string}
          </span>
        ))}
      </div>

      {/* Hit effects */}
      <AnimatePresence>
        {Array.from(hitNotes).slice(-5).map((noteKey) => {
          const [time, pitch] = noteKey.split('-').map(Number);
          const stringIndex = pitchToString(pitch);
          
          return (
            <motion.div
              key={noteKey}
              className="absolute pointer-events-none"
              style={{
                left: `${(stringIndex + 0.5) * (100 / 6)}%`,
                bottom: '15%',
                transform: 'translate(-50%, 50%)',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${stringColors[stringIndex]} 0%, transparent 70%)`,
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
