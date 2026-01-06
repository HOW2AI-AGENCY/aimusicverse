/**
 * Projects Service
 * Business logic for music project operations
 */

import * as projectsApi from '@/api/projects.api';

export type { ProjectRow, ProjectTrackRow } from '@/api/projects.api';

export type ProjectType = 'single' | 'ep' | 'album' | 'ost' | 'background_music' | 'jingle' | 'compilation' | 'mixtape';

export const PROJECT_TYPES: Record<ProjectType, { label: string; description: string; trackCount: string }> = {
  single: { label: 'Сингл', description: '1-2 трека', trackCount: '1-2' },
  ep: { label: 'EP', description: '3-6 треков', trackCount: '3-6' },
  album: { label: 'Альбом', description: '7-15+ треков', trackCount: '7-15' },
  ost: { label: 'Саундтрек', description: 'Музыка для видео/игр', trackCount: '5-20' },
  background_music: { label: 'Фоновая музыка', description: 'Ambient, лаунж', trackCount: '5-10' },
  jingle: { label: 'Джингл', description: 'Короткий рекламный трек', trackCount: '1-3' },
  compilation: { label: 'Компиляция', description: 'Сборник треков', trackCount: '10-20' },
  mixtape: { label: 'Микстейп', description: 'Свободный формат', trackCount: '5-15' },
};

// Visual Style Types
export type ImageStyle = 
  | 'photorealistic' 
  | 'illustration' 
  | '3d_render' 
  | 'anime' 
  | 'abstract' 
  | 'minimalist' 
  | 'vintage' 
  | 'cyberpunk' 
  | 'watercolor' 
  | 'oil_painting';

export const IMAGE_STYLES: Record<ImageStyle, { label: string; description: string }> = {
  photorealistic: { label: 'Фотореализм', description: 'Реалистичные изображения' },
  illustration: { label: 'Иллюстрация', description: 'Художественные иллюстрации' },
  '3d_render': { label: '3D Рендер', description: '3D графика и рендеры' },
  anime: { label: 'Аниме', description: 'Японский стиль аниме' },
  abstract: { label: 'Абстракция', description: 'Абстрактное искусство' },
  minimalist: { label: 'Минимализм', description: 'Простые чистые формы' },
  vintage: { label: 'Винтаж', description: 'Ретро эстетика' },
  cyberpunk: { label: 'Киберпанк', description: 'Неоновое будущее' },
  watercolor: { label: 'Акварель', description: 'Акварельная живопись' },
  oil_painting: { label: 'Масло', description: 'Масляная живопись' },
};

export type TypographyStyle = 
  | 'modern' 
  | 'classic' 
  | 'handwritten' 
  | 'bold' 
  | 'minimal' 
  | 'grunge' 
  | 'elegant' 
  | 'retro';

export const TYPOGRAPHY_STYLES: Record<TypographyStyle, { label: string; description: string }> = {
  modern: { label: 'Современный', description: 'Чистые sans-serif шрифты' },
  classic: { label: 'Классический', description: 'Традиционные serif шрифты' },
  handwritten: { label: 'Рукописный', description: 'Каллиграфия и рукопись' },
  bold: { label: 'Жирный', description: 'Крупные заголовки' },
  minimal: { label: 'Минималистичный', description: 'Тонкие линии' },
  grunge: { label: 'Гранж', description: 'Текстурные и грязные' },
  elegant: { label: 'Элегантный', description: 'Изысканные шрифты' },
  retro: { label: 'Ретро', description: 'Винтажная типографика' },
};

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  [key: string]: string | undefined; // Index signature for Json compatibility
}

export interface VisualStyle {
  imageStyle?: ImageStyle;
  typographyStyle?: TypographyStyle;
  colorPalette?: ColorPalette;
  visualKeywords?: string[];
  visualAesthetic?: string;
}

// Track Parameter Types
export type VocalStyle = 
  | 'soft' 
  | 'powerful' 
  | 'raspy' 
  | 'smooth' 
  | 'emotional' 
  | 'robotic' 
  | 'whisper' 
  | 'operatic';

export const VOCAL_STYLES: Record<VocalStyle, { label: string; description: string }> = {
  soft: { label: 'Мягкий', description: 'Нежный и спокойный вокал' },
  powerful: { label: 'Мощный', description: 'Сильный и громкий вокал' },
  raspy: { label: 'Хриплый', description: 'Грубый с хрипотцой' },
  smooth: { label: 'Гладкий', description: 'Плавный R&B стиль' },
  emotional: { label: 'Эмоциональный', description: 'Экспрессивный и чувственный' },
  robotic: { label: 'Роботизированный', description: 'Вокодер/автотюн эффект' },
  whisper: { label: 'Шёпот', description: 'Тихий интимный вокал' },
  operatic: { label: 'Оперный', description: 'Классический оперный стиль' },
};

export interface TrackParams {
  bpmTarget?: number;
  keySignature?: string;
  energyLevel?: number;
  vocalStyle?: VocalStyle;
  instrumentalOnly?: boolean;
  durationTarget?: number;
  referenceUrl?: string;
}

/**
 * Create a new project with default public visibility based on subscription
 */
export async function createProject(
  userId: string,
  title: string,
  projectType: ProjectType,
  options?: {
    genre?: string;
    mood?: string;
    description?: string;
    visualStyle?: VisualStyle;
  }
): Promise<projectsApi.ProjectRow> {
  // Check premium status for default visibility
  const isPremium = await projectsApi.checkPremiumStatus(userId);
  
  return projectsApi.createProject({
    user_id: userId,
    title,
    project_type: projectType,
    genre: options?.genre || null,
    mood: options?.mood || null,
    description: options?.description || null,
    is_public: !isPremium, // Free users create public by default
    image_style: options?.visualStyle?.imageStyle || null,
    typography_style: options?.visualStyle?.typographyStyle || null,
    color_palette: options?.visualStyle?.colorPalette || null,
    visual_keywords: options?.visualStyle?.visualKeywords || null,
    visual_aesthetic: options?.visualStyle?.visualAesthetic || null,
  });
}

/**
 * Update project visual style
 */
export async function updateVisualStyle(
  projectId: string,
  visualStyle: VisualStyle
): Promise<projectsApi.ProjectRow> {
  return projectsApi.updateProject(projectId, {
    image_style: visualStyle.imageStyle || null,
    typography_style: visualStyle.typographyStyle || null,
    color_palette: visualStyle.colorPalette || null,
    visual_keywords: visualStyle.visualKeywords || null,
    visual_aesthetic: visualStyle.visualAesthetic || null,
  });
}

/**
 * Generate AI project concept
 */
export async function generateConcept(params: {
  projectType: string;
  genre?: string;
  mood?: string;
  targetAudience?: string;
  theme?: string;
  artistPersona?: string;
}): Promise<{
  concept: string;
  suggestedTracks: Array<{ title: string; description: string }>;
  moodBoard: string[];
}> {
  const data = await projectsApi.generateProjectConcept(params);
  return data as {
    concept: string;
    suggestedTracks: Array<{ title: string; description: string }>;
    moodBoard: string[];
  };
}

/**
 * Get project progress statistics
 */
export async function getProjectProgress(projectId: string): Promise<{
  totalTracks: number;
  completedTracks: number;
  progressPercent: number;
}> {
  const tracks = await projectsApi.fetchProjectTracks(projectId);
  const totalTracks = tracks.length;
  const completedTracks = tracks.filter(t => t.track_id !== null).length;
  const progressPercent = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;
  
  return { totalTracks, completedTracks, progressPercent };
}
