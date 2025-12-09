/**
 * Centralized animation tokens for Studio and Guitar Analysis
 */

export const studioAnimations = {
  // Chord change animation
  chordChange: {
    scale: [1, 1.15, 1],
    opacity: [0.7, 1, 0.9],
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Waveform pulse on beat
  waveformPulse: {
    boxShadow: [
      '0 0 20px hsl(var(--primary) / 0.2)',
      '0 0 40px hsl(var(--primary) / 0.5)',
      '0 0 20px hsl(var(--primary) / 0.2)',
    ],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  },

  // Tab switch animation
  tabSwitch: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Card entrance
  cardEntrance: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Floating animation
  float: {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },

  // Glow pulse
  glowPulse: {
    opacity: [0.5, 1, 0.5],
    scale: [0.98, 1.02, 0.98],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },

  // Note hit burst
  noteHit: {
    scale: [0, 1.5, 1],
    opacity: [1, 0.8, 0],
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Slide in from bottom
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },

  // Expand effect
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },

  // Stagger children
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.05 } },
  },

  staggerChild: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
};

// Chord type colors
export const chordColors: Record<string, string> = {
  major: 'hsl(200, 80%, 60%)',
  minor: 'hsl(280, 70%, 60%)',
  '7': 'hsl(30, 80%, 60%)',
  m7: 'hsl(320, 70%, 60%)',
  maj7: 'hsl(160, 70%, 60%)',
  dim: 'hsl(0, 70%, 60%)',
  aug: 'hsl(50, 80%, 60%)',
  sus: 'hsl(180, 60%, 60%)',
  add: 'hsl(100, 60%, 60%)',
  default: 'hsl(var(--primary))',
};

// Stem type visual identity
export const stemColors: Record<string, { bg: string; border: string; glow: string; icon: string }> = {
  vocals: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/30',
    icon: '🎤',
  },
  drums: {
    bg: 'from-orange-500/10 to-orange-600/5',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/30',
    icon: '🥁',
  },
  bass: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/30',
    icon: '🎸',
  },
  guitar: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/30',
    icon: '🎸',
  },
  piano: {
    bg: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/30',
    icon: '🎹',
  },
  other: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/30',
    icon: '🎵',
  },
};

// Get chord color based on chord name
export function getChordColor(chord: string): string {
  const lowerChord = chord.toLowerCase();
  
  if (lowerChord.includes('dim')) return chordColors.dim;
  if (lowerChord.includes('aug')) return chordColors.aug;
  if (lowerChord.includes('maj7')) return chordColors.maj7;
  if (lowerChord.includes('m7')) return chordColors.m7;
  if (lowerChord.includes('7')) return chordColors['7'];
  if (lowerChord.includes('sus')) return chordColors.sus;
  if (lowerChord.includes('add')) return chordColors.add;
  if (lowerChord.includes('m') && !lowerChord.includes('maj')) return chordColors.minor;
  
  // Check for major (no modifier or just root)
  if (/^[A-G](#|b)?$/.test(chord)) return chordColors.major;
  
  return chordColors.default;
}

// Get stem color config
export function getStemColor(stemType: string) {
  const normalized = stemType.toLowerCase();
  return stemColors[normalized] || stemColors.other;
}
