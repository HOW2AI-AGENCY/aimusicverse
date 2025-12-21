import {
  Music2,
  Library,
  Sparkles,
  Trophy,
  Wand2
} from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  highlightSelector?: string;
  route?: string;
  features?: string[];
  tip?: string;
  imageId?: string;
  videoUrl?: string;
}

/**
 * Optimized onboarding - 5 key steps
 * Sprint UI/UX: Reduced from 15 to 5 essential steps
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать!',
    description: 'MusicVerse — AI-платформа для создания музыки. Генерируйте треки, тексты и ремиксы за минуты.',
    icon: Sparkles,
    features: [
      'Генерация полноценных треков с AI',
      'Профессиональное качество звука',
      'Неограниченные эксперименты'
    ],
    tip: 'Начните с простого описания вашей идеи'
  },
  {
    id: 'generate',
    title: 'Генерация музыки',
    description: 'Опишите желаемый трек — AI создаст уникальную композицию. Используйте пресеты для быстрого старта.',
    icon: Music2,
    route: '/',
    features: [
      'Быстрые пресеты одним нажатием',
      'Простой и кастомный режимы',
      'A/B версии для сравнения'
    ],
    tip: 'Попробуйте пресет Rock или Pop для первого трека'
  },
  {
    id: 'library',
    title: 'Ваша библиотека',
    description: 'Все треки хранятся в библиотеке. Свайпайте для быстрых действий.',
    icon: Library,
    route: '/library',
    features: [
      'Свайп влево — добавить в очередь',
      'Свайп вправо — сменить версию',
      'Экспорт в разных форматах'
    ],
    tip: 'Жесты работают на карточках треков'
  },
  {
    id: 'studio',
    title: 'Студия обработки',
    description: 'Разделяйте треки на стемы, редактируйте и создавайте ремиксы.',
    icon: Wand2,
    route: '/library',
    features: [
      'AI-разделение на вокал, бас, ударные',
      'Замена секций трека',
      'Создание ремиксов'
    ],
    tip: 'Откройте трек и нажмите "Стемы"'
  },
  {
    id: 'gamification',
    title: 'Достижения и бонусы',
    description: 'Зарабатывайте кредиты, открывайте достижения и делитесь музыкой.',
    icon: Trophy,
    features: [
      'Ежедневные бонусы за вход',
      '+3 кредита за публикацию',
      'Система уровней и наград'
    ],
    tip: 'Заходите каждый день для бонусов!'
  }
];
