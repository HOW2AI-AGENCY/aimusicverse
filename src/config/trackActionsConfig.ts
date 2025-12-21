import {
  Download, Share2, Send, Folder, ListMusic, 
  Scissors, Wand2, ImagePlus, Music2, Video, Layers,
  Plus, Music, Globe, Lock, Info, Trash2,
  Link, FileAudio, FileMusic, Archive, Disc, RefreshCw, Pencil, User, Mic2
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type ActionId = 
  // Info
  | 'details' | 'toggle_public' | 'rename'
  // Download
  | 'download_mp3' | 'download_wav' | 'download_stems'
  // Share
  | 'generate_video' | 'send_telegram' | 'copy_link' | 'add_to_playlist' | 'add_to_project'
  // Studio
  | 'open_studio' | 'replace_section' | 'stems_simple' | 'stems_detailed' | 'transcribe_midi' | 'transcribe_notes'
  // Create
  | 'generate_cover' | 'cover' | 'extend' | 'remix' | 'create_artist_persona' | 'add_vocals'
  // Delete
  | 'delete_version' | 'delete_all';

export type ActionCategory = 
  | 'info'
  | 'download' 
  | 'share' 
  | 'studio' 
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

  // Download Actions (Priority 11-20)
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
  download_stems: {
    id: 'download_stems',
    label: 'Архив стемов',
    icon: Archive,
    category: 'download',
    priority: 13,
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

  // Delete Actions (Priority 100+)
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
