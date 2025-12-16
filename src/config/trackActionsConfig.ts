import {
  Play, ListPlus, Download, Share2, Send, Folder, ListMusic, Sparkles,
  Scissors, Wand2, ImagePlus, FileAudio, Music2, Video, Layers,
  Plus, Mic, Volume2, Music, Globe, Lock, Info, FileText, Trash2,
  CheckCircle2, Loader2, Flag
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type ActionId = 
  | 'play_next' | 'add_to_queue' | 'watch_video'
  | 'download' | 'share' | 'send_telegram'
  | 'add_to_playlist' | 'add_to_project' | 'create_artist'
  | 'open_studio' | 'stems_simple' | 'stems_detailed' | 'generate_cover' | 'convert_wav' | 'transcribe_midi' | 'generate_video'
  | 'extend' | 'cover' | 'new_arrangement' | 'new_vocal' | 'remix'
  | 'details' | 'lyrics' | 'toggle_public'
  | 'report' | 'delete';

export type ActionCategory = 
  | 'queue' 
  | 'share' 
  | 'organize' 
  | 'studio' 
  | 'edit' 
  | 'info' 
  | 'danger';

export interface TrackAction {
  id: ActionId;
  label: string;
  icon: LucideIcon;
  category: ActionCategory;
  priority: number; // Lower = higher priority (shown first)
  requiresAudio?: boolean;
  requiresCompleted?: boolean;
  requiresSunoId?: boolean;
  requiresSunoTaskId?: boolean;
  requiresStems?: boolean;
  dangerous?: boolean;
}

// Single source of truth for all track actions
export const TRACK_ACTIONS: Record<ActionId, TrackAction> = {
  // Queue Actions (Priority 1-10)
  play_next: {
    id: 'play_next',
    label: 'Воспроизвести следующим',
    icon: Play,
    category: 'queue',
    priority: 1,
    requiresAudio: true,
    requiresCompleted: true,
  },
  add_to_queue: {
    id: 'add_to_queue',
    label: 'Добавить в очередь',
    icon: ListPlus,
    category: 'queue',
    priority: 2,
    requiresAudio: true,
    requiresCompleted: true,
  },
  watch_video: {
    id: 'watch_video',
    label: 'Смотреть видео',
    icon: Video,
    category: 'queue',
    priority: 3,
    requiresCompleted: true,
  },

  // Share Actions (Priority 11-20)
  download: {
    id: 'download',
    label: 'Скачать',
    icon: Download,
    category: 'share',
    priority: 11,
    requiresAudio: true,
    requiresCompleted: true,
  },
  share: {
    id: 'share',
    label: 'Поделиться',
    icon: Share2,
    category: 'share',
    priority: 12,
    requiresAudio: true,
    requiresCompleted: true,
  },
  send_telegram: {
    id: 'send_telegram',
    label: 'Отправить в Telegram',
    icon: Send,
    category: 'share',
    priority: 13,
    requiresAudio: true,
    requiresCompleted: true,
  },

  // Organize Actions (Priority 21-30)
  add_to_playlist: {
    id: 'add_to_playlist',
    label: 'Добавить в плейлист',
    icon: ListMusic,
    category: 'organize',
    priority: 21,
    requiresCompleted: true,
  },
  add_to_project: {
    id: 'add_to_project',
    label: 'Добавить в проект',
    icon: Folder,
    category: 'organize',
    priority: 22,
    requiresCompleted: true,
  },
  create_artist: {
    id: 'create_artist',
    label: 'Создать артиста',
    icon: Sparkles,
    category: 'organize',
    priority: 23,
    requiresCompleted: true,
  },

  // Studio Actions (Priority 31-40)
  open_studio: {
    id: 'open_studio',
    label: 'Открыть в студии',
    icon: Layers,
    category: 'studio',
    priority: 31,
  },
  stems_simple: {
    id: 'stems_simple',
    label: 'Стемы (простое)',
    icon: Scissors,
    category: 'studio',
    priority: 32,
    requiresSunoId: true,
  },
  stems_detailed: {
    id: 'stems_detailed',
    label: 'Стемы (детальное)',
    icon: Wand2,
    category: 'studio',
    priority: 33,
    requiresSunoId: true,
  },
  generate_cover: {
    id: 'generate_cover',
    label: 'Генерировать обложку',
    icon: ImagePlus,
    category: 'studio',
    priority: 34,
    requiresCompleted: true,
  },
  convert_wav: {
    id: 'convert_wav',
    label: 'Конвертировать в WAV',
    icon: FileAudio,
    category: 'studio',
    priority: 35,
    requiresSunoId: true,
  },
  transcribe_midi: {
    id: 'transcribe_midi',
    label: 'Транскрибировать в MIDI',
    icon: Music2,
    category: 'studio',
    priority: 36,
    requiresAudio: true,
  },
  generate_video: {
    id: 'generate_video',
    label: 'Создать видеоклип',
    icon: Video,
    category: 'studio',
    priority: 37,
    requiresSunoId: true,
    requiresSunoTaskId: true,
  },

  // Edit Actions (Priority 41-50)
  extend: {
    id: 'extend',
    label: 'Расширить',
    icon: Plus,
    category: 'edit',
    priority: 41,
    requiresCompleted: true,
  },
  cover: {
    id: 'cover',
    label: 'Кавер',
    icon: Music,
    category: 'edit',
    priority: 42,
    requiresCompleted: true,
    requiresAudio: true,
  },
  new_arrangement: {
    id: 'new_arrangement',
    label: 'Новая аранжировка',
    icon: Volume2,
    category: 'edit',
    priority: 43,
    requiresCompleted: true,
    requiresStems: true,
  },
  new_vocal: {
    id: 'new_vocal',
    label: 'Новый вокал',
    icon: Mic,
    category: 'edit',
    priority: 44,
    requiresCompleted: true,
    requiresStems: true,
  },
  remix: {
    id: 'remix',
    label: 'Ремикс',
    icon: Music,
    category: 'edit',
    priority: 45,
    requiresSunoId: true,
  },

  // Info Actions (Priority 51-60)
  details: {
    id: 'details',
    label: 'Детали трека',
    icon: Info,
    category: 'info',
    priority: 51,
  },
  lyrics: {
    id: 'lyrics',
    label: 'Текст песни',
    icon: FileText,
    category: 'info',
    priority: 52,
  },
  toggle_public: {
    id: 'toggle_public',
    label: 'Видимость',
    icon: Globe,
    category: 'info',
    priority: 53,
  },

  // Danger Actions (Priority 100+)
  report: {
    id: 'report',
    label: 'Пожаловаться',
    icon: Flag,
    category: 'danger',
    priority: 99,
  },
  delete: {
    id: 'delete',
    label: 'Удалить',
    icon: Trash2,
    category: 'danger',
    priority: 100,
    dangerous: true,
  },
};

// Category labels for grouping
export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  queue: 'Воспроизведение',
  share: 'Поделиться',
  organize: 'Организация',
  studio: 'Студия',
  edit: 'Редактирование',
  info: 'Информация',
  danger: '',
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
