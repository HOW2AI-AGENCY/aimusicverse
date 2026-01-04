/**
 * Stem Actions Configuration
 * Defines available actions for different stem types
 */

import { LucideIcon } from 'lucide-react';
import {
  Download, Sliders, Sparkles, FileMusic, Music2,
  Mic2, Guitar, UserMinus, Wand2, Waves, Gauge, Music,
  Grid3X3, Circle, Square, Activity, Flame, ArrowDown, ArrowUp,
  Radio, Copy, Volume2, VolumeX, Trash2, Share2, Scissors, ArrowRight,
} from 'lucide-react';

export type StemType = 'vocal' | 'instrumental' | 'drums' | 'bass' | 'guitar' | 'piano' | 'other' | 'main' | 'stem' | 'sfx';

export interface StemAction {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  stemTypes: StemType[] | 'all';
  category: 'ai' | 'effects' | 'edit' | 'export' | 'danger';
  requiresAudio?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * All available stem actions organized by category
 */
export const STEM_ACTIONS: StemAction[] = [
  // === AI ACTIONS ===
  {
    id: 'add_instrumental',
    label: 'Добавить аранжировку',
    icon: Guitar,
    description: 'AI генерация инструментала под вокал',
    stemTypes: ['vocal'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'add_vocals',
    label: 'Добавить вокал',
    icon: Mic2,
    description: 'AI генерация вокала под инструментал',
    stemTypes: ['instrumental'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'remove_backing',
    label: 'Убрать бэк-вокал',
    icon: UserMinus,
    description: 'Изолировать основной вокал',
    stemTypes: ['vocal'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'pitch_correction',
    label: 'Автотюн',
    icon: Wand2,
    description: 'Автоматическая коррекция питча',
    stemTypes: ['vocal'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'change_key',
    label: 'Сменить тональность',
    icon: Music,
    description: 'Транспонирование без изменения темпа',
    stemTypes: ['instrumental', 'main'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'change_tempo',
    label: 'Сменить темп',
    icon: Gauge,
    description: 'Изменение скорости без изменения питча',
    stemTypes: ['instrumental', 'main', 'drums'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'quantize',
    label: 'Квантизация',
    icon: Grid3X3,
    description: 'Выровнять удары по сетке',
    stemTypes: ['drums'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'replace_kick',
    label: 'Заменить бочку',
    icon: Circle,
    description: 'Заменить звук бочки',
    stemTypes: ['drums'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'replace_snare',
    label: 'Заменить малый',
    icon: Square,
    description: 'Заменить звук малого барабана',
    stemTypes: ['drums'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'add_sidechain',
    label: 'Сайдчейн',
    icon: Activity,
    description: 'Добавить сайдчейн компрессию',
    stemTypes: ['drums', 'bass'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'saturate',
    label: 'Сатурация',
    icon: Flame,
    description: 'Теплый аналоговый перегруз',
    stemTypes: ['bass', 'guitar'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'sub_enhance',
    label: 'Усилить саб',
    icon: ArrowDown,
    description: 'Добавить суббасовые частоты',
    stemTypes: ['bass'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'octave_up',
    label: 'Октава выше',
    icon: ArrowUp,
    description: 'Транспонировать на октаву вверх',
    stemTypes: ['bass'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'amp_sim',
    label: 'Эмуляция усилителя',
    icon: Radio,
    description: 'Гитарный усилитель с кабинетом',
    stemTypes: ['guitar', 'bass', 'other'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'double_track',
    label: 'Даблтрекинг',
    icon: Copy,
    description: 'Дублирование с легкой расстройкой',
    stemTypes: ['guitar', 'vocal', 'other'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'extend',
    label: 'Расширить трек',
    icon: ArrowRight,
    description: 'AI продолжение трека',
    stemTypes: ['main'],
    category: 'ai',
    requiresAudio: true,
  },
  {
    id: 'replace_section',
    label: 'Заменить секцию',
    icon: Scissors,
    description: 'Перегенерировать часть трека',
    stemTypes: ['main'],
    category: 'ai',
    requiresAudio: true,
  },

  // === EFFECTS ===
  {
    id: 'effects',
    label: 'Эффекты',
    icon: Sliders,
    description: 'EQ, компрессор, реверб, дилей',
    stemTypes: 'all',
    category: 'effects',
    requiresAudio: true,
  },
  {
    id: 'de_ess',
    label: 'Де-эссер',
    icon: Waves,
    description: 'Убрать свистящие звуки',
    stemTypes: ['vocal'],
    category: 'effects',
    requiresAudio: true,
  },

  // === EDIT ===
  {
    id: 'transcribe',
    label: 'MIDI / Ноты',
    icon: FileMusic,
    description: 'Транскрипция в MIDI и ноты',
    stemTypes: 'all',
    category: 'edit',
    requiresAudio: true,
  },
  {
    id: 'reference',
    label: 'Как референс',
    icon: Sparkles,
    description: 'Использовать для новой генерации',
    stemTypes: 'all',
    category: 'edit',
    requiresAudio: true,
  },

  // === EXPORT ===
  {
    id: 'download',
    label: 'Скачать',
    icon: Download,
    description: 'Экспорт в MP3 или WAV',
    stemTypes: 'all',
    category: 'export',
    requiresAudio: true,
  },
  {
    id: 'share',
    label: 'Поделиться',
    icon: Share2,
    description: 'Отправить в Telegram',
    stemTypes: 'all',
    category: 'export',
    requiresAudio: true,
  },

  // === DANGER ===
  {
    id: 'delete',
    label: 'Удалить',
    icon: Trash2,
    description: 'Удалить дорожку',
    stemTypes: 'all',
    category: 'danger',
  },
];

/**
 * Get actions available for a specific stem type
 */
export function getActionsForStemType(stemType: StemType, hasAudio: boolean = true): StemAction[] {
  return STEM_ACTIONS.filter(action => {
    // Check stem type match
    const typeMatch = action.stemTypes === 'all' || action.stemTypes.includes(stemType);
    
    // Check audio requirement
    const audioMatch = !action.requiresAudio || hasAudio;
    
    return typeMatch && audioMatch;
  });
}

/**
 * Get actions grouped by category
 */
export function getGroupedActions(stemType: StemType, hasAudio: boolean = true): Record<string, StemAction[]> {
  const actions = getActionsForStemType(stemType, hasAudio);
  
  return actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, StemAction[]>);
}

/**
 * Category labels for UI
 */
export const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI Обработка',
  effects: 'Эффекты',
  edit: 'Редактирование',
  export: 'Экспорт',
  danger: 'Опасная зона',
};

/**
 * Get stem type from track type string
 */
export function normalizeTrackType(type: string): StemType {
  const typeMap: Record<string, StemType> = {
    'main': 'main',
    'vocal': 'vocal',
    'vocals': 'vocal',
    'vox': 'vocal',
    'instrumental': 'instrumental',
    'inst': 'instrumental',
    'drums': 'drums',
    'drum': 'drums',
    'bass': 'bass',
    'guitar': 'guitar',
    'gtr': 'guitar',
    'piano': 'piano',
    'keys': 'piano',
    'stem': 'other',
    'sfx': 'other',
    'other': 'other',
  };
  
  return typeMap[type.toLowerCase()] || 'other';
}
