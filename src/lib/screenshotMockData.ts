import { Profile } from '@/hooks/useProfile';

// Minimal track type for screenshots (subset of full Track)
export interface MockTrack {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string | null;
  status: string | null;
  audio_url: string | null;
  cover_url: string | null;
  duration: number | null;
  is_public: boolean | null;
  plays_count: number | null;
  likes_count: number;
  is_liked: boolean;
  genre: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

// Mock profile for screenshot mode
export const mockProfile: Profile = {
  id: 'mock-profile-id',
  user_id: 'mock-user-id',
  telegram_id: 123456789,
  first_name: 'Алексей',
  last_name: 'Музыкант',
  username: 'alexmusic',
  display_name: 'Alex Music',
  language_code: 'ru',
  photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexmusic',
  banner_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200',
  bio: '🎵 AI-музыкант | Создаю треки с помощью нейросетей | 47 треков | Premium',
  is_public: true,
  subscription_tier: 'premium',
  telegram_chat_id: 123456789,
  profile_completeness: 95,
  social_links: {
    telegram: '@alexmusic',
    spotify: 'alexmusic',
  },
  created_at: '2024-01-15T10:00:00Z',
  updated_at: new Date().toISOString(),
};

// Mock user stats
export const mockStats = {
  totalTracks: 47,
  totalPlays: 12850,
  totalLikes: 892,
  generationsThisMonth: 23,
  totalProjects: 8,
  totalPlaylists: 5,
  totalArtists: 3,
  publicTracks: 32,
  creditsBalance: 150,
  level: 12,
  experience: 2450,
};

// Mock user credits
export const mockCredits = {
  id: 'mock-credits-id',
  user_id: 'mock-user-id',
  credits_balance: 150,
  lifetime_credits: 500,
  level: 12,
  experience: 2450,
  streak_days: 7,
  last_daily_claim: new Date().toISOString(),
};

// Generate mock tracks
const trackTitles = [
  'Летний закат',
  'Городские огни',
  'Ночной драйв',
  'Весенний ветер',
  'Мечты о море',
  'Звёздная пыль',
  'Электрический рассвет',
  'Тихая гавань',
  'Ритм сердца',
  'Последний танец',
  'Неоновые ночи',
  'Путь домой',
  'Осенний блюз',
  'Радиоволны',
  'Первый снег',
];

const genres = ['Electronic', 'Pop', 'Lo-Fi', 'Ambient', 'Hip-Hop', 'Rock', 'Jazz', 'R&B'];
const moods = ['Energetic', 'Chill', 'Melancholic', 'Happy', 'Dreamy', 'Intense'];

export const mockTracks: MockTrack[] = trackTitles.map((title, index) => ({
  id: `mock-track-${index + 1}`,
  user_id: 'mock-user-id',
  title,
  prompt: `AI-generated ${genres[index % genres.length].toLowerCase()} track with ${moods[index % moods.length].toLowerCase()} vibes`,
  status: 'completed',
  audio_url: 'https://cdn1.suno.ai/2a7c2c1a-4f3c-4d2a-9b5d-6e7f8a9b0c1d.mp3',
  cover_url: `https://picsum.photos/seed/${index + 1}/400/400`,
  duration: 120 + Math.floor(Math.random() * 120),
  is_public: index < 10,
  plays_count: Math.floor(Math.random() * 1000) + 100,
  likes_count: Math.floor(Math.random() * 100) + 10,
  is_liked: index % 3 === 0, // Every 3rd track is liked
  genre: genres[index % genres.length],
  mood: moods[index % moods.length],
  created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
}));

// Mock projects
export const mockProjects = [
  {
    id: 'mock-project-1',
    user_id: 'mock-user-id',
    title: 'Summer Vibes EP',
    description: 'Коллекция летних треков для хорошего настроения',
    cover_url: 'https://picsum.photos/seed/project1/400/400',
    genre: 'Electronic',
    mood: 'Energetic',
    status: 'in_progress',
    total_tracks_count: 5,
    approved_tracks_count: 3,
    created_at: '2024-06-01T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-project-2',
    user_id: 'mock-user-id',
    title: 'Night City Album',
    description: 'Атмосферные треки для ночных прогулок',
    cover_url: 'https://picsum.photos/seed/project2/400/400',
    genre: 'Lo-Fi',
    mood: 'Chill',
    status: 'completed',
    total_tracks_count: 8,
    approved_tracks_count: 8,
    created_at: '2024-05-15T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z',
  },
  {
    id: 'mock-project-3',
    user_id: 'mock-user-id',
    title: 'Acoustic Sessions',
    description: 'Акустические версии популярных треков',
    cover_url: 'https://picsum.photos/seed/project3/400/400',
    genre: 'Acoustic',
    mood: 'Melancholic',
    status: 'draft',
    total_tracks_count: 4,
    approved_tracks_count: 1,
    created_at: '2024-06-20T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

// Mock playlists
export const mockPlaylists = [
  {
    id: 'mock-playlist-1',
    user_id: 'mock-user-id',
    title: 'Мои лучшие',
    description: 'Подборка лучших треков',
    cover_url: 'https://picsum.photos/seed/playlist1/400/400',
    is_public: true,
    track_count: 12,
    total_duration: 2400,
    created_at: '2024-05-01T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-playlist-2',
    user_id: 'mock-user-id',
    title: 'Для работы',
    description: 'Фоновая музыка для концентрации',
    cover_url: 'https://picsum.photos/seed/playlist2/400/400',
    is_public: false,
    track_count: 8,
    total_duration: 1800,
    created_at: '2024-05-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-playlist-3',
    user_id: 'mock-user-id',
    title: 'Вечерний чилл',
    description: 'Расслабляющие треки для вечера',
    cover_url: 'https://picsum.photos/seed/playlist3/400/400',
    is_public: true,
    track_count: 15,
    total_duration: 3200,
    created_at: '2024-06-01T10:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

// Mock artists
export const mockArtists = [
  {
    id: 'mock-artist-1',
    user_id: 'mock-user-id',
    name: 'NeonWave',
    bio: 'Synthwave и ретро-электроника',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=neonwave',
    genre_tags: ['Synthwave', 'Electronic', 'Retro'],
    is_public: true,
    created_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 'mock-artist-2',
    user_id: 'mock-user-id',
    name: 'ChillMaster',
    bio: 'Lo-Fi beats для учёбы и работы',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=chillmaster',
    genre_tags: ['Lo-Fi', 'Chill', 'Ambient'],
    is_public: true,
    created_at: '2024-04-15T10:00:00Z',
  },
  {
    id: 'mock-artist-3',
    user_id: 'mock-user-id',
    name: 'BeatFactory',
    bio: 'Хип-хоп биты и инструменталы',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=beatfactory',
    genre_tags: ['Hip-Hop', 'Trap', 'R&B'],
    is_public: true,
    created_at: '2024-05-01T10:00:00Z',
  },
];

// Mock achievements
export const mockAchievements = [
  { code: 'first_track', unlocked: true, unlockedAt: '2024-01-15T10:00:00Z' },
  { code: 'ten_tracks', unlocked: true, unlockedAt: '2024-02-20T10:00:00Z' },
  { code: 'first_like', unlocked: true, unlockedAt: '2024-01-16T10:00:00Z' },
  { code: 'hundred_plays', unlocked: true, unlockedAt: '2024-03-01T10:00:00Z' },
  { code: 'first_project', unlocked: true, unlockedAt: '2024-02-01T10:00:00Z' },
  { code: 'premium_member', unlocked: true, unlockedAt: '2024-04-01T10:00:00Z' },
  { code: 'streak_7_days', unlocked: true, unlockedAt: '2024-06-15T10:00:00Z' },
  { code: 'thousand_plays', unlocked: false },
  { code: 'fifty_tracks', unlocked: false },
];

// Mock generation form data
export const mockGenerationFormData = {
  prompt: 'Энергичный электронный трек с синтезаторами в стиле 80-х, драйвовый ритм, атмосфера ночного города',
  genre: 'Synthwave',
  mood: 'Energetic',
  instrumental: false,
  duration: 180,
};

// Mock lyrics
export const mockLyrics = `[Verse 1]
Городские огни мерцают в ночи
Неоновый свет ведёт меня вперёд
Сквозь пустые улицы бегу я один
Ритм сердца совпадает с битом

[Chorus]
Это наша ночь, это наш момент
Звёзды светят ярче, чем когда-либо
Танцуем до рассвета, забыв обо всём
Музыка ведёт нас сквозь темноту

[Verse 2]
Басы сотрясают стены клуба
Каждый удар — как удар сердца
Мы все здесь ради одного
Потеряться в музыке и найти себя`;

// Screen configurations for screenshot navigator
export const screenshotScreens = [
  { id: 'home', path: '/', label: 'Главная', description: 'Лента публичных треков' },
  { id: 'library', path: '/library', label: 'Библиотека', description: 'Все мои треки' },
  { id: 'generate', path: '/generate', label: 'Генерация', description: 'Создание нового трека' },
  { id: 'projects', path: '/projects', label: 'Проекты', description: 'Музыкальные проекты' },
  { id: 'profile', path: '/profile', label: 'Профиль', description: 'Мой профиль' },
  { id: 'studio', path: '/studio-v2', label: 'Студия', description: 'Stem-студия' },
  { id: 'lyrics', path: '/lyrics-studio', label: 'Тексты', description: 'Редактор текстов' },
  { id: 'community', path: '/community', label: 'Сообщество', description: 'Публичные треки' },
  { id: 'rewards', path: '/rewards', label: 'Награды', description: 'Достижения и бонусы' },
  { id: 'settings', path: '/settings', label: 'Настройки', description: 'Настройки приложения' },
  { id: 'credits', path: '/credits', label: 'Кредиты', description: 'Баланс и покупки' },
];
