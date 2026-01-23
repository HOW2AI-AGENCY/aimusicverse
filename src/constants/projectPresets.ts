/**
 * Project Presets - Pre-configured project templates
 * 
 * Templates for quick project creation with predefined
 * settings for genre, mood, type, and description
 */

import { Flame, Headphones, Mic, Film, Music, Radio } from 'lucide-react';

export interface ProjectPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  shortDescription: string;
  type: 'album' | 'ep' | 'single' | 'mixtape' | 'ost';
  genre: string;
  mood: string;
  trackCount: number;
  concept?: string;
  tags?: string[];
  colorClass: string;
  bgClass: string;
}

export const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: 'drill-ep',
    name: 'Drill EP',
    emoji: '🔥',
    description: 'Агрессивный drill с 808 басами и trap-хэтами',
    shortDescription: '5 треков • Drill/Trap',
    type: 'ep',
    genre: 'Drill, Trap, Hip-Hop',
    mood: 'aggressive, dark, powerful',
    trackCount: 5,
    concept: 'Hard-hitting drill EP with heavy 808s and dark atmospheric beats',
    tags: ['drill', '808', 'trap', 'hi-hats', 'dark'],
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
  },
  {
    id: 'lofi-album',
    name: 'Lofi Альбом',
    emoji: '🎧',
    description: 'Расслабляющий chillhop для учёбы и работы',
    shortDescription: '10 треков • Lofi/Chill',
    type: 'album',
    genre: 'Lofi, Chill, Hip-Hop',
    mood: 'chill, relaxed, nostalgic',
    trackCount: 10,
    concept: 'Relaxing lo-fi album with jazzy samples and dusty beats',
    tags: ['lofi', 'chill', 'jazz', 'vinyl', 'study'],
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
  },
  {
    id: 'pop-single',
    name: 'Поп Сингл',
    emoji: '🎤',
    description: 'Радио-хит с запоминающимся припевом',
    shortDescription: '2 версии • Pop',
    type: 'single',
    genre: 'Pop, Dance',
    mood: 'upbeat, catchy, energetic',
    trackCount: 2,
    concept: 'Radio-ready pop single with catchy hooks and modern production',
    tags: ['pop', 'radio', 'vocal', 'catchy', 'hit'],
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
  },
  {
    id: 'ost-collection',
    name: 'OST Коллекция',
    emoji: '🎬',
    description: 'Кинематографический саундтрек',
    shortDescription: '8 треков • Cinematic',
    type: 'ost',
    genre: 'Cinematic, Orchestral',
    mood: 'epic, emotional, dramatic',
    trackCount: 8,
    concept: 'Cinematic soundtrack collection with orchestral arrangements',
    tags: ['cinematic', 'orchestra', 'epic', 'film', 'emotional'],
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  {
    id: 'hiphop-mixtape',
    name: 'Хип-хоп Микстейп',
    emoji: '🎤',
    description: 'Street хип-хоп микстейп с raw звучанием',
    shortDescription: '12 треков • Hip-Hop',
    type: 'mixtape',
    genre: 'Hip-Hop, Rap',
    mood: 'street, raw, authentic',
    trackCount: 12,
    concept: 'Raw street hip-hop mixtape with boom-bap and modern trap elements',
    tags: ['hip-hop', 'rap', 'street', 'boom-bap', 'bars'],
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
  },
  {
    id: 'electronic-ep',
    name: 'Электроника EP',
    emoji: '🎹',
    description: 'EDM/House с энергичными drops',
    shortDescription: '6 треков • Electronic',
    type: 'ep',
    genre: 'Electronic, EDM, House',
    mood: 'energetic, futuristic, euphoric',
    trackCount: 6,
    concept: 'Electronic EP with powerful drops and atmospheric builds',
    tags: ['edm', 'house', 'synth', 'drop', 'dance'],
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
  },
];

// Icon component type for presets
export type PresetIconComponent = typeof Flame;

// Get icon component for preset
export function getProjectPresetIcon(presetId: string): PresetIconComponent {
  switch (presetId) {
    case 'drill-ep': return Flame;
    case 'lofi-album': return Headphones;
    case 'pop-single': return Mic;
    case 'ost-collection': return Film;
    case 'hiphop-mixtape': return Music;
    case 'electronic-ep': return Radio;
    default: return Music;
  }
}

// Get preset by ID
export function getProjectPresetById(id: string): ProjectPreset | undefined {
  return PROJECT_PRESETS.find(p => p.id === id);
}

// Map preset type to Russian
export function getProjectTypeLabel(type: ProjectPreset['type']): string {
  const labels: Record<ProjectPreset['type'], string> = {
    album: 'Альбом',
    ep: 'EP',
    single: 'Сингл',
    mixtape: 'Микстейп',
    ost: 'Саундтрек',
  };
  return labels[type] || type;
}
