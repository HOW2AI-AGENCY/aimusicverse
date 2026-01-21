/**
 * AI Agent Constants and Tool Definitions
 */

import {
  PenLine,
  Zap,
  Target,
  Tag,
  LayoutGrid,
  Mic2,
  Music2,
  Wand2,
  BarChart3,
  Headphones,
  Telescope,
  Quote,
  CornerDownRight,
  Activity,
  Shuffle,
  RefreshCw,
  Languages,
} from 'lucide-react';
import { AITool } from './types';

/**
 * AI Tools - Streamlined for better UX
 * Phase 4: Reduced from 17 to 8 core tools
 * 
 * Merged tools:
 * - analyze + rhythm → analyze (unified analysis)
 * - producer + hook_generator + vocal_map → producer (full review)
 * - optimize + validate_v5 → optimize (Suno-ready)
 * - style_convert + paraphrase → style_convert (rewrite variants)
 * - drill_builder + epic_builder → (moved to genre presets in Write)
 */
export const AI_TOOLS: AITool[] = [
  // === PRIMARY TOOLS (always visible) ===
  {
    id: 'write',
    name: 'Написать',
    icon: PenLine,
    action: 'smart_generate',
    description: 'Создать текст',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    inputFields: ['theme', 'mood', 'structure'],
    outputType: 'lyrics',
  },
  {
    id: 'continue',
    name: 'Продолжить',
    icon: CornerDownRight,
    action: 'continue_line',
    description: 'Продолжить текст',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30',
    autoContext: true,
    outputType: 'lyrics',
  },
  {
    id: 'analyze',
    name: 'Анализ',
    icon: BarChart3,
    action: 'full_analysis',
    description: 'Ритм, рифмы, структура',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    autoContext: true,
    outputType: 'full_analysis',
  },
  {
    id: 'producer',
    name: 'Продюсер',
    icon: Headphones,
    action: 'producer_review',
    description: 'Полный разбор + хуки + вокал',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    autoContext: true,
    outputType: 'producer_review',
  },
  {
    id: 'optimize',
    name: 'Suno',
    icon: Wand2,
    action: 'optimize_for_suno',
    description: 'Теги + валидация V5',
    color: 'text-primary',
    bgColor: 'bg-primary/10 hover:bg-primary/20 border-primary/30',
    autoContext: true,
    outputType: 'lyrics',
    directApply: true,
  },
  // === SECONDARY TOOLS (expanded) ===
  {
    id: 'rhyme',
    name: 'Рифмы',
    icon: Quote,
    action: 'suggest_rhymes',
    description: 'Найти рифмы к слову',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30',
    outputType: 'rhymes',
  },
  {
    id: 'structure',
    name: 'Структура',
    icon: LayoutGrid,
    action: 'fit_structure',
    description: 'Перестроить по шаблону',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30',
    autoContext: true,
    outputType: 'lyrics',
  },
  {
    id: 'style_convert',
    name: 'Стиль',
    icon: Shuffle,
    action: 'style_convert',
    description: 'Вариации и перефраз',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30',
    autoContext: true,
    outputType: 'lyrics',
  },
  {
    id: 'translate',
    name: 'Перевод',
    icon: Languages,
    action: 'translate_adapt',
    description: 'Адаптивный перевод',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    autoContext: true,
    outputType: 'lyrics',
  },
];

export const TAG_CATEGORIES = {
  vocal: {
    name: 'Вокал',
    icon: Mic2,
    tags: [
      'Male Vocal', 'Female Vocal', 'Duet', 'Choir', 
      'Whisper', 'Falsetto', 'Belting', 'Raspy', 
      'Smooth', 'Powerful', 'Gentle', 'Emotional'
    ]
  },
  dynamics: {
    name: 'Динамика',
    icon: Zap,
    tags: [
      'Build', 'Drop', 'Breakdown', 'Climax', 
      'Soft', 'Loud', 'Intense', 'Calm', 
      'Explosive', 'Fade Out', 'Crescendo'
    ]
  },
  instruments: {
    name: 'Инструменты',
    icon: Music2,
    tags: [
      'Acoustic Guitar', 'Electric Guitar', 'Piano', 'Synth',
      'Drums', 'Bass', 'Strings', 'Brass',
      'Full Band', 'Orchestra', '808 Bass', 'Hi-Hats'
    ]
  },
  mood: {
    name: 'Настроение',
    icon: Target,
    tags: [
      'Happy', 'Sad', 'Angry', 'Romantic',
      'Epic', 'Melancholic', 'Energetic', 'Peaceful',
      'Dark', 'Hopeful', 'Nostalgic', 'Dreamy'
    ]
  },
};

export const STRUCTURE_OPTIONS = [
  { value: 'verse-chorus', label: 'Verse - Chorus', desc: 'Классическая структура' },
  { value: 'full', label: 'Полная', desc: 'Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro' },
  { value: 'minimal', label: 'Минимальная', desc: 'Verse, Hook, Verse' },
  { value: 'progressive', label: 'Прогрессивная', desc: 'С нарастанием и кульминацией' },
];

export const MOOD_OPTIONS = [
  { value: 'romantic', label: 'Романтика', emoji: '💕' },
  { value: 'energetic', label: 'Энергия', emoji: '⚡' },
  { value: 'melancholic', label: 'Меланхолия', emoji: '🌧️' },
  { value: 'happy', label: 'Радость', emoji: '☀️' },
  { value: 'dark', label: 'Мрачный', emoji: '🌑' },
  { value: 'epic', label: 'Эпичный', emoji: '🎆' },
  { value: 'peaceful', label: 'Спокойный', emoji: '🌿' },
  { value: 'nostalgic', label: 'Ностальгия', emoji: '📷' },
];

export const GENRE_OPTIONS = [
  { value: 'pop', label: 'Pop', emoji: '🎤' },
  { value: 'rock', label: 'Rock', emoji: '🎸' },
  { value: 'hip-hop', label: 'Hip-Hop', emoji: '🎧' },
  { value: 'electronic', label: 'Electronic', emoji: '🎹' },
  { value: 'r&b', label: 'R&B', emoji: '🎷' },
  { value: 'indie', label: 'Indie', emoji: '🌙' },
  { value: 'folk', label: 'Folk', emoji: '🪕' },
  { value: 'jazz', label: 'Jazz', emoji: '🎺' },
  // V5 новые жанры
  { value: 'drill', label: 'UK Drill', emoji: '🔥' },
  { value: 'trap', label: 'Trap', emoji: '💎' },
  { value: 'phonk', label: 'Phonk', emoji: '👻' },
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖' },
  { value: 'latin', label: 'Latin', emoji: '💃' },
  { value: 'metal', label: 'Metal', emoji: '🤘' },
  { value: 'afrobeat', label: 'Afrobeat', emoji: '🌍' },
  { value: 'house', label: 'House', emoji: '🏠' },
  { value: 'ambient', label: 'Ambient', emoji: '🌌' },
];

// Специализированные билдеры промптов V5
export const PROMPT_BUILDERS = [
  { id: 'drill', label: 'Drill Builder', action: 'drill_prompt_builder', emoji: '🔥', description: 'UK/US Drill с 808 и агрессией' },
  { id: 'epic', label: 'Epic Builder', action: 'epic_prompt_builder', emoji: '🎬', description: 'Cinematic, оркестровый эпик' },
];

// Схемы рифмовки
export const RHYME_SCHEMES = [
  { value: 'aabb', label: 'AABB', description: 'Парные рифмы (drill, hip-hop)' },
  { value: 'abab', label: 'ABAB', description: 'Перекрёстные (поп, баллады)' },
  { value: 'aabccb', label: 'AABCCB', description: 'Сложные (сторителлинг)' },
  { value: 'abcabc', label: 'ABCABC', description: 'Прогрессивные (эпик)' },
];
