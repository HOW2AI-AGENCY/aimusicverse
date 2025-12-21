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
} from 'lucide-react';
import { AITool } from './types';

export const AI_TOOLS: AITool[] = [
  {
    id: 'write',
    name: 'Написать',
    icon: PenLine,
    action: 'smart_generate',
    description: 'Создать полный текст с нуля',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    inputFields: ['theme', 'mood', 'structure'],
    outputType: 'lyrics',
  },
  {
    id: 'continue',
    name: 'Продолжить',
    icon: Zap,
    action: 'continue_line',
    description: 'Дописать существующий текст',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    autoContext: true,
    outputType: 'lyrics',
  },
  {
    id: 'hook',
    name: 'Хук',
    icon: Target,
    action: 'generate_section',
    description: 'Создать запоминающийся хук',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30',
    outputType: 'lyrics',
  },
  {
    id: 'tags',
    name: 'Теги',
    icon: Tag,
    action: 'generate_compound_tags',
    description: 'Генерация тегов Suno V5',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    outputType: 'tags',
    directApply: true,
  },
  {
    id: 'structure',
    name: 'Структура',
    icon: LayoutGrid,
    action: 'suggest_structure',
    description: 'Улучшить структуру песни',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    autoContext: true,
    outputType: 'suggestions',
  },
  {
    id: 'rhymes',
    name: 'Рифмы',
    icon: Mic2,
    action: 'suggest_rhymes',
    description: 'Найти и улучшить рифмы',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30',
    inputFields: ['word'],
    outputType: 'rhymes',
  },
  {
    id: 'rhythm',
    name: 'Ритм',
    icon: Music2,
    action: 'analyze_rhythm',
    description: 'Анализ ритма и слогов',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
    autoContext: true,
    outputType: 'analysis',
  },
  {
    id: 'optimize',
    name: 'Suno Ready',
    icon: Wand2,
    action: 'optimize_for_suno',
    description: 'Оптимизация для генерации',
    color: 'text-primary',
    bgColor: 'bg-primary/10 hover:bg-primary/20 border-primary/30',
    autoContext: true,
    outputType: 'lyrics',
    directApply: true,
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
