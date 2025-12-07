import { Music2, Mic2, Library, Layers, FolderKanban, UserCircle, ListMusic, Sparkles, Hand, Waves, FileMusic } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  highlightSelector?: string;
  route?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в AI Music Studio!',
    description: 'Создавайте уникальную музыку с помощью искусственного интеллекта. Давайте познакомимся с основными возможностями приложения.',
    icon: Sparkles,
  },
  {
    id: 'generate',
    title: 'Генерация музыки',
    description: 'Опишите желаемый трек или используйте режим Custom для полного контроля над текстом и стилем. AI создаст уникальную композицию за несколько минут.',
    icon: Music2,
    route: '/',
  },
  {
    id: 'lyrics',
    title: 'AI Lyrics Wizard',
    description: 'Профессиональный мастер создания текстов: от концепции до готовой песни с мета-тегами для точной генерации.',
    icon: Mic2,
  },
  {
    id: 'library',
    title: 'Ваша библиотека',
    description: 'Все созданные треки хранятся здесь. Каждая генерация создаёт A/B версии — сравнивайте и выбирайте лучший вариант.',
    icon: Library,
    route: '/library',
  },
  {
    id: 'versions',
    title: 'A/B Версии треков',
    description: 'Переключайтесь между версиями одним касанием на карточке трека. На мобильных устройствах используйте свайп вправо.',
    icon: Layers,
  },
  {
    id: 'swipe',
    title: 'Быстрые действия',
    description: 'На мобильных: свайп влево — добавить в очередь, свайп вправо — сменить версию. Быстро и удобно!',
    icon: Hand,
  },
  {
    id: 'stem-studio',
    title: 'Stem Studio',
    description: 'Разделяйте треки на отдельные дорожки (вокал, ударные, бас). Управляйте громкостью каждого стема, используйте mute/solo, видите waveform визуализацию.',
    icon: Waves,
    route: '/stem-studio',
  },
  {
    id: 'midi',
    title: 'MIDI Транскрипция',
    description: 'Конвертируйте аудио в MIDI файлы для использования в DAW. Выбирайте между моделями MT3 (точная) или Basic Pitch (быстрая).',
    icon: FileMusic,
  },
  {
    id: 'projects',
    title: 'Музыкальные проекты',
    description: 'Организуйте треки в альбомы, EP или синглы. Планируйте треклист и генерируйте музыку в контексте проекта.',
    icon: FolderKanban,
    route: '/projects',
  },
  {
    id: 'artists',
    title: 'AI Артисты',
    description: 'Создавайте уникальные AI-персоны с собственным стилем и голосом. Генерируйте портреты и используйте артистов для создания треков.',
    icon: UserCircle,
    route: '/artists',
  },
  {
    id: 'playlists',
    title: 'Плейлисты',
    description: 'Группируйте треки в плейлисты, делитесь ими и наслаждайтесь музыкой. AI автоматически создаёт плейлисты по жанрам.',
    icon: ListMusic,
    route: '/playlists',
  },
];
