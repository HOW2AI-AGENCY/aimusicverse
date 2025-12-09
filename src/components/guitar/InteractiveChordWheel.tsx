/**
 * InteractiveChordWheel - Circular chord progression visualization
 * Displays chords arranged in a wheel with animated playhead
 */

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChordColor } from '@/lib/studio-animations';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Chord {
  chord: string;
  start: number;
  end: number;
}

interface InteractiveChordWheelProps {
  chords: Chord[];
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  size?: number;
}

export const InteractiveChordWheel = memo(function InteractiveChordWheel({
  chords,
  currentTime,
  duration,
  onSeek,
  size = 280,
}: InteractiveChordWheelProps) {
  const haptic = useHapticFeedback();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredChord, setHoveredChord] = useState<Chord | null>(null);
  const [activeChord, setActiveChord] = useState<Chord | null>(null);

  // Find current chord
  useEffect(() => {
    const current = chords.find(
      c => currentTime >= c.start && currentTime < c.end
    );
    if (current && current !== activeChord) {
      setActiveChord(current);
      haptic.selectionChanged();
    }
  }, [currentTime, chords, activeChord, haptic]);

  // Calculate segment data
  const segments = useMemo(() => {
    if (!duration || duration === 0) return [];
    
    return chords.map((chord, index) => {
      const startAngle = (chord.start / duration) * Math.PI * 2 - Math.PI / 2;
      const endAngle = (chord.end / duration) * Math.PI * 2 - Math.PI / 2;
      const midAngle = (startAngle + endAngle) / 2;
      
      return {
        ...chord,
        index,
        startAngle,
        endAngle,
        midAngle,
        color: getChordColor(chord.chord),
      };
    });
  }, [chords, duration]);

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size / 2 - 10;
    const innerRadius = outerRadius * 0.5;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw segments
    segments.forEach((segment) => {
      const isActive = activeChord?.chord === segment.chord && 
                       activeChord?.start === segment.start;
      const isHovered = hoveredChord?.chord === segment.chord &&
                        hoveredChord?.start === segment.start;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, segment.startAngle, segment.endAngle);
      ctx.arc(centerX, centerY, innerRadius, segment.endAngle, segment.startAngle, true);
      ctx.closePath();

      // Fill with gradient
      const gradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius
      );
      
      const alpha = isActive ? 1 : isHovered ? 0.8 : 0.6;
      gradient.addColorStop(0, segment.color.replace(')', `, ${alpha * 0.3})`).replace('hsl', 'hsla'));
      gradient.addColorStop(1, segment.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla'));
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      if (isActive || isHovered) {
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = isActive ? 3 : 2;
        ctx.stroke();
      }

      // Chord label
      const labelRadius = (innerRadius + outerRadius) / 2;
      const labelX = centerX + Math.cos(segment.midAngle) * labelRadius;
      const labelY = centerY + Math.sin(segment.midAngle) * labelRadius;
      
      ctx.save();
      ctx.translate(labelX, labelY);
      
      // Rotate text to be readable
      let rotation = segment.midAngle + Math.PI / 2;
      if (rotation > Math.PI / 2 && rotation < Math.PI * 1.5) {
        rotation += Math.PI;
      }
      ctx.rotate(rotation);
      
      ctx.fillStyle = isActive ? '#fff' : 'hsl(var(--foreground) / 0.8)';
      ctx.font = `${isActive ? 'bold ' : ''}${Math.min(14, size / 20)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(segment.chord, 0, 0);
      ctx.restore();
    });

    // Draw playhead
    const playheadAngle = (currentTime / duration) * Math.PI * 2 - Math.PI / 2;
    const playheadX = centerX + Math.cos(playheadAngle) * (outerRadius + 5);
    const playheadY = centerY + Math.sin(playheadAngle) * (outerRadius + 5);

    // Glow effect
    ctx.beginPath();
    ctx.arc(playheadX, playheadY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary) / 0.3)';
    ctx.fill();

    // Playhead dot
    ctx.beginPath();
    ctx.arc(playheadX, playheadY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fill();

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 5, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fill();

    // Center time display
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = `bold ${size / 12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, centerX, centerY - 10);

    // Current chord
    if (activeChord) {
      ctx.font = `bold ${size / 8}px sans-serif`;
      ctx.fillStyle = getChordColor(activeChord.chord);
      ctx.fillText(activeChord.chord, centerX, centerY + 20);
    }

  }, [segments, size, currentTime, duration, activeChord, hoveredChord]);

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !duration) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    // Calculate angle from center
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    
    // Convert to time
    const time = (angle / (Math.PI * 2)) * duration;
    onSeek(time);
    haptic.impact('light');
  };

  // Handle hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    
    const time = (angle / (Math.PI * 2)) * duration;
    const hovered = chords.find(c => time >= c.start && time < c.end);
    setHoveredChord(hovered || null);
  };

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredChord(null)}
        className="cursor-pointer touch-none"
      />

      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, transparent 60%, ${activeChord ? getChordColor(activeChord.chord).replace(')', ', 0.2)').replace('hsl', 'hsla') : 'transparent'} 100%)`,
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Chord change indicator */}
      <AnimatePresence>
        {activeChord && (
          <motion.div
            key={`${activeChord.chord}-${activeChord.start}`}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="px-4 py-2 rounded-full text-lg font-bold shadow-lg"
              style={{
                backgroundColor: getChordColor(activeChord.chord).replace(')', ', 0.2)').replace('hsl', 'hsla'),
                color: getChordColor(activeChord.chord),
                boxShadow: `0 4px 20px ${getChordColor(activeChord.chord).replace(')', ', 0.4)').replace('hsl', 'hsla')}`,
              }}
            >
              {activeChord.chord}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
