import {
  Download, Share2, Send, Folder, ListMusic, 
  Scissors, Wand2, ImagePlus, Music2, Video, Layers,
  Plus, Music, Globe, Lock, Info, Trash2,
  Link, FileAudio, FileMusic, Archive, Disc, RefreshCw, Pencil, User, Mic2,
  Sparkles
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type ActionId = 
  // Info
  | 'details' | 'toggle_public' | 'rename'
  // Queue
  | 'add_to_queue' | 'play_next'
  // Download
  | 'download' | 'download_mp3' | 'download_wav' | 'download_stems' | 'download_midi'
  // Share
  | 'share' | 'generate_video' | 'send_telegram' | 'copy_link' | 'add_to_playlist' | 'add_to_project'
  // Studio
  | 'open_studio' | 'replace_section' | 'stems' | 'stems_simple' | 'stems_detailed' | 'transcribe_midi' | 'transcribe_notes'
  // Quality
  | 'upscale' | 'upscale_hd' | 'remove_watermark'
  // Create
  | 'generate_cover' | 'cover' | 'extend' | 'remix' | 'generate_similar' | 'create_artist_persona' | 'add_vocals' | 'add_instrumental'
  // Delete
  | 'delete' | 'delete_version' | 'delete_all';

export type ActionCategory = 
  | 'info'
  | 'download' 
  | 'share' 
  | 'studio' 
  | 'quality'
  | 'create'
  | 'delete';

export interface TrackAction {
  id: ActionId;
  label: string;
  icon: LucideIcon;
  category: ActionCategory;
  priority: number;
  requiresAudio?: boolean;
  requiresCompleted?: boolean;
  requiresSunoId?: boolean;
  requiresSunoTaskId?: boolean;
  requiresStems?: boolean;
  requiresInstrumental?: boolean;
  dangerous?: boolean;
}

// Single source of truth for all track actions
export const TRACK_ACTIONS: Record<ActionId, TrackAction> = {
  // Info Actions (Priority 1-10)
  details: {
    id: 'details',
    label: 'Детали трека',
    icon: Info,
    category: 'info',
    priority: 1,
  },
  toggle_public: {
    id: 'toggle_public',
    label: 'Видимость',
    icon: Globe,
    category: 'info',
    priority: 2,
    requiresCompleted: true,
    requiresAudio: true,
  },
  rename: {
    id: 'rename',
    label: 'Переименовать',
    icon: Pencil,
    category: 'info',
    priority: 3,
  },

  // Queue Actions (Priority 4-10)
  add_to_queue: {
    id: 'add_to_queue',
    label: 'Добавить в очередь',
    icon: ListMusic,
    category: 'info',
    priority: 4,
    requiresAudio: true,
    requiresCompleted: true,
  },
  play_next: {
    id: 'play_next',
    label: 'Играть следующим',
    icon: Plus,
    category: 'info',
    priority: 5,
    requiresAudio: true,
    requiresCompleted: true,
  },

  // Download Actions (Priority 11-20)
  download: {
    id: 'download',
    label: 'Скачать аудио',
    icon: Download,
    category: 'download',
    priority: 10,
    requiresAudio: true,
    requiresCompleted: true,
  },
  download_mp3: {
    id: 'download_mp3',
    label: 'MP3',
    icon: FileAudio,
    category: 'download',
    priority: 11,
    requiresAudio: true,
    requiresCompleted: true,
  },
  download_wav: {
    id: 'download_wav',
    label: 'WAV',
    icon: FileMusic,
    category: 'download',
    priority: 12,
    requiresSunoId: true,
  },
  download_midi: {
    id: 'download_midi',
    label: 'MIDI',
    icon: Music2,
    category: 'download',
    priority: 13,
    requiresAudio: true,
  },
  download_stems: {
    id: 'download_stems',
    label: 'Архив стемов',
    icon: Archive,
    category: 'download',
    priority: 14,
    requiresStems: true,
  },

  // Share Actions (Priority 21-30)
  generate_video: {
    id: 'generate_video',
    label: 'Создать видео',
    icon: Video,
    category: 'share',
    priority: 21,
    requiresSunoId: true,
    requiresSunoTaskId: true,
  },
  send_telegram: {
    id: 'send_telegram',
    label: 'Отправить в Telegram',
    icon: Send,
    category: 'share',
    priority: 22,
    requiresAudio: true,
    requiresCompleted: true,
  },
  share: {
    id: 'share',
    label: 'Поделиться',
    icon: Share2,
    category: 'share',
    priority: 22,
    requiresCompleted: true,
  },
  copy_link: {
    id: 'copy_link',
    label: 'Скопировать ссылку',
    icon: Link,
    category: 'share',
    priority: 23,
    requiresCompleted: true,
  },
  add_to_playlist: {
    id: 'add_to_playlist',
    label: 'В плейлист',
    icon: ListMusic,
    category: 'share',
    priority: 24,
    requiresCompleted: true,
  },
  add_to_project: {
    id: 'add_to_project',
    label: 'В проект',
    icon: Folder,
    category: 'share',
    priority: 25,
    requiresCompleted: true,
  },

  // Studio Actions (Priority 31-40)
  open_studio: {
    id: 'open_studio',
    label: 'Открыть студию',
    icon: Layers,
    category: 'studio',
    priority: 31,
    requiresCompleted: true,
  },
  replace_section: {
    id: 'replace_section',
    label: 'Замена секции',
    icon: RefreshCw,
    category: 'studio',
    priority: 32,
    requiresCompleted: true,
  },
  stems: {
    id: 'stems',
    label: 'Разделить на стемы',
    icon: Scissors,
    category: 'studio',
    priority: 32,
    requiresSunoId: true,
  },
  stems_simple: {
    id: 'stems_simple',
    label: 'Стемы (2 дорожки)',
    icon: Scissors,
    category: 'studio',
    priority: 33,
    requiresSunoId: true,
  },
  stems_detailed: {
    id: 'stems_detailed',
    label: 'Стемы (6+ дорожек)',
    icon: Wand2,
    category: 'studio',
    priority: 34,
    requiresSunoId: true,
  },
  transcribe_midi: {
    id: 'transcribe_midi',
    label: 'MIDI',
    icon: Music2,
    category: 'studio',
    priority: 35,
    requiresAudio: true,
  },
  transcribe_notes: {
    id: 'transcribe_notes',
    label: 'Ноты',
    icon: FileMusic,
    category: 'studio',
    priority: 36,
    requiresAudio: true,
  },

  // Quality Actions (Priority 37-40)
  upscale: {
    id: 'upscale',
    label: 'Улучшить качество',
    icon: Sparkles,
    category: 'quality',
    priority: 37,
    requiresAudio: true,
    requiresCompleted: true,
  },
  upscale_hd: {
    id: 'upscale_hd',
    label: 'HD Audio (48kHz)',
    icon: Sparkles,
    category: 'quality',
    priority: 38,
    requiresAudio: true,
    requiresCompleted: true,
  },
  remove_watermark: {
    id: 'remove_watermark',
    label: 'Убрать водяной знак',
    icon: Wand2,
    category: 'quality',
    priority: 39,
    requiresAudio: true,
    requiresCompleted: true,
  },

  // Create Actions (Priority 41-50)
  generate_cover: {
    id: 'generate_cover',
    label: 'Обложка',
    icon: ImagePlus,
    category: 'create',
    priority: 41,
    requiresCompleted: true,
  },
  cover: {
    id: 'cover',
    label: 'Кавер версия',
    icon: Disc,
    category: 'create',
    priority: 42,
    requiresCompleted: true,
    requiresAudio: true,
  },
  extend: {
    id: 'extend',
    label: 'Расширить трек',
    icon: Plus,
    category: 'create',
    priority: 43,
    requiresCompleted: true,
  },
  remix: {
    id: 'remix',
    label: 'Ремикс',
    icon: Music,
    category: 'create',
    priority: 44,
    requiresSunoId: true,
  },
  generate_similar: {
    id: 'generate_similar',
    label: 'Создать похожий',
    icon: Wand2,
    category: 'create',
    priority: 45,
    requiresCompleted: true,
  },
  create_artist_persona: {
    id: 'create_artist_persona',
    label: 'Создать артиста',
    icon: User,
    category: 'create',
    priority: 45,
    requiresCompleted: true,
  },
  add_vocals: {
    id: 'add_vocals',
    label: 'Добавить вокал',
    icon: Mic2,
    category: 'create',
    priority: 46,
    requiresCompleted: true,
    requiresAudio: true,
    requiresInstrumental: true,
  },
  add_instrumental: {
    id: 'add_instrumental',
    label: 'Добавить инструментал',
    icon: Music,
    category: 'create',
    priority: 47,
    requiresCompleted: true,
    requiresAudio: true,
  },

  // Delete Actions (Priority 100+)
  delete: {
    id: 'delete',
    label: 'Удалить трек',
    icon: Trash2,
    category: 'delete',
    priority: 99,
    dangerous: true,
  },
  delete_version: {
    id: 'delete_version',
    label: 'Удалить версию',
    icon: Trash2,
    category: 'delete',
    priority: 100,
    dangerous: true,
  },
  delete_all: {
    id: 'delete_all',
    label: 'Удалить все версии',
    icon: Trash2,
    category: 'delete',
    priority: 101,
    dangerous: true,
  },
};

// Category labels for grouping
export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  info: 'Информация',
  download: 'Скачать',
  share: 'Поделиться',
  studio: 'Открыть в студии',
  quality: 'Качество',
  create: 'Создать',
  delete: 'Удалить',
};

// Get actions sorted by priority
export function getActionsByPriority(): TrackAction[] {
  return Object.values(TRACK_ACTIONS).sort((a, b) => a.priority - b.priority);
}

// Get actions grouped by category
export function getActionsByCategory(): Record<ActionCategory, TrackAction[]> {
  const grouped = {} as Record<ActionCategory, TrackAction[]>;
  
  for (const action of getActionsByPriority()) {
    if (!grouped[action.category]) {
      grouped[action.category] = [];
    }
    grouped[action.category].push(action);
  }
  
  return grouped;
}
