import { memo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PianoKeyboardProps {
  startNote?: number;
  endNote?: number;
  noteHeight: number;
  activeNotes?: Set<number>;
  onNoteClick?: (pitch: number) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function isBlackKey(pitch: number): boolean {
  const note = pitch % 12;
  return [1, 3, 6, 8, 10].includes(note);
}

function getNoteName(pitch: number): string {
  const note = NOTE_NAMES[pitch % 12];
  const octave = Math.floor(pitch / 12) - 1;
  return `${note}${octave}`;
}

// Simple audio context for preview
let audioContext: AudioContext | null = null;

function playNote(pitch: number) {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  
  const frequency = 440 * Math.pow(2, (pitch - 69) / 12);
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'triangle';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}

export const PianoKeyboard = memo(function PianoKeyboard({
  startNote = 24,
  endNote = 96,
  noteHeight,
  activeNotes = new Set(),
  onNoteClick,
}: PianoKeyboardProps) {
  const keys = [];
  
  // Build keys from high to low (top to bottom)
  for (let pitch = endNote; pitch >= startNote; pitch--) {
    const isBlack = isBlackKey(pitch);
    const isActive = activeNotes.has(pitch);
    const noteName = getNoteName(pitch);
    const isC = pitch % 12 === 0;
    
    keys.push(
      <div
        key={pitch}
        className={cn(
          "relative flex items-center justify-end pr-1 cursor-pointer transition-colors border-b border-border/30",
          isBlack 
            ? "bg-zinc-800 text-zinc-400" 
            : "bg-zinc-100 dark:bg-zinc-200 text-zinc-600",
          isActive && (isBlack ? "bg-primary/80" : "bg-primary/60"),
          "hover:opacity-80"
        )}
        style={{ height: noteHeight }}
        onClick={() => {
          playNote(pitch);
          onNoteClick?.(pitch);
        }}
      >
        {isC && (
          <span className="text-[9px] font-medium select-none">
            {noteName}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-12 flex flex-col border-r border-border shrink-0">
      {keys}
    </div>
  );
});
