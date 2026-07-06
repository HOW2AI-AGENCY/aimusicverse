/**
 * Stem track configuration — icons, labels, gradients, accents
 * Extracted from IntegratedStemTracks.tsx — Sprint 051 T056 decomposition
 */

import { Mic2, Guitar, Drum, Music, Piano, Waves, Sliders, Sparkles } from "@/lib/icons";
import { getStemColor } from "@/lib/design-colors";

export interface StemTrackConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortLabel: string;
  gradient: string;
  accent: string;
}

export const stemConfig: Record<string, StemTrackConfig> = {
  vocals: {
    icon: Mic2,
    label: "Вокал",
    shortLabel: "VOX",
    gradient: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  },
  vocal: {
    icon: Mic2,
    label: "Вокал",
    shortLabel: "VOX",
    gradient: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  },
  drums: {
    icon: Drum,
    label: "Ударные",
    shortLabel: "DRM",
    gradient: "from-orange-500/20 to-orange-600/5",
    accent: "text-orange-400 bg-orange-500/20 border-orange-500/30",
  },
  bass: {
    icon: Waves,
    label: "Бас",
    shortLabel: "BAS",
    gradient: "from-purple-500/20 to-purple-600/5",
    accent: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  },
  guitar: {
    icon: Guitar,
    label: "Гитара",
    shortLabel: "GTR",
    gradient: "from-amber-500/20 to-amber-600/5",
    accent: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  },
  piano: {
    icon: Piano,
    label: "Пианино",
    shortLabel: "PNO",
    gradient: "from-pink-500/20 to-pink-600/5",
    accent: "text-pink-400 bg-pink-500/20 border-pink-500/30",
  },
  strings: {
    icon: Music,
    label: "Струнные",
    shortLabel: "STR",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  },
  synth: {
    icon: Sliders,
    label: "Синтезатор",
    shortLabel: "SYN",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    accent: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  },
  instrumental: {
    icon: Guitar,
    label: "Инструментал",
    shortLabel: "INS",
    gradient: "from-green-500/20 to-green-600/5",
    accent: "text-green-400 bg-green-500/20 border-green-500/30",
  },
  generated_drums: {
    icon: Drum,
    label: "Ударные AI",
    shortLabel: "DRM+",
    gradient: "from-orange-500/20 to-yellow-600/5",
    accent: "text-orange-400 bg-orange-500/20 border-orange-500/30",
  },
  generated_bass: {
    icon: Waves,
    label: "Бас AI",
    shortLabel: "BAS+",
    gradient: "from-purple-500/20 to-violet-600/5",
    accent: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  },
  generated_piano: {
    icon: Piano,
    label: "Пианино AI",
    shortLabel: "PNO+",
    gradient: "from-pink-500/20 to-rose-600/5",
    accent: "text-pink-400 bg-pink-500/20 border-pink-500/30",
  },
  generated_strings: {
    icon: Music,
    label: "Струнные AI",
    shortLabel: "STR+",
    gradient: "from-emerald-500/20 to-teal-600/5",
    accent: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  },
  generated_synth: {
    icon: Sliders,
    label: "Синтезатор AI",
    shortLabel: "SYN+",
    gradient: "from-cyan-500/20 to-blue-600/5",
    accent: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  },
  generated_sfx: {
    icon: Sparkles,
    label: "Эффекты AI",
    shortLabel: "SFX+",
    gradient: "from-yellow-500/20 to-orange-600/5",
    accent: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  },
  other: {
    icon: Music,
    label: "Другое",
    shortLabel: "OTH",
    gradient: getStemColor("other").gradient,
    accent: `${getStemColor("other").text} ${getStemColor("other").bg} ${getStemColor("other").border}`,
  },
};

export interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

export function getStemConfig(stemType: string): StemTrackConfig {
  return stemConfig[stemType] ?? stemConfig.other;
}
