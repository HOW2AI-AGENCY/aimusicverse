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
} from 'lucide-react';
import { AITool } from './types';

export const AI_TOOLS: AITool[] = [
  {
    id: 'write',
    name: 'Написать',
    icon: PenLine,
    action: 'smart_generate',
    description: 'Создать текст с нуля',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    inputFields: ['theme', 'mood', 'structure'],
    outputType: 'lyrics',
  },
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
    id: 'tags',
    name: 'Теги',
    icon: Tag,
    action: 'add_tags',
    description: 'Мета-теги Suno',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    autoContext: true,
    outputType: 'tags',
  },
  {
    id: 'analyze',
    name: 'Анализ',
    icon: BarChart3,
    action: 'full_analysis',
    description: 'Смысл, ритм, структура',
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
    description: 'Проф. разбор',
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
    description: 'Подготовка к генерации',
    color: 'text-primary',
    bgColor: 'bg-primary/10 hover:bg-primary/20 border-primary/30',
    autoContext: true,
    outputType: 'lyrics',
    directApply: true,
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
    id: 'rhythm',
    name: 'Ритм',
    icon: Activity,
    action: 'analyze_rhythm',
    description: 'Анализ слогов и ритма',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
    autoContext: true,
    outputType: 'analysis',
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
];
