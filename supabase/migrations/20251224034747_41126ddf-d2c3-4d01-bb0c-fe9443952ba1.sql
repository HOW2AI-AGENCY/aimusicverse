-- Add cover image and detailed description fields to subscription_tiers
ALTER TABLE public.subscription_tiers 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS detailed_description JSONB NOT NULL DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN public.subscription_tiers.cover_url IS 'URL обложки тарифа для Telegram бота';
COMMENT ON COLUMN public.subscription_tiers.detailed_description IS 'Детальное описание тарифа для вложенного меню { "ru": "...", "en": "..." }';

-- Update existing tiers with detailed descriptions
UPDATE public.subscription_tiers SET 
  cover_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  detailed_description = '{
    "ru": "🎵 Начните свой творческий путь бесплатно!\n\n✅ 50 кредитов ежедневно\n✅ 2 трека одновременно\n✅ Стандартное качество звука\n✅ Базовые стили генерации\n✅ Сохранение в библиотеку\n\n💡 Идеально для знакомства с платформой и экспериментов с AI-музыкой.",
    "en": "🎵 Start your creative journey for free!\n\n✅ 50 credits daily\n✅ 2 tracks simultaneously\n✅ Standard audio quality\n✅ Basic generation styles\n✅ Library storage\n\n💡 Perfect for exploring the platform and experimenting with AI music."
  }'::jsonb
WHERE code = 'free';

UPDATE public.subscription_tiers SET 
  cover_url = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
  detailed_description = '{
    "ru": "🥉 Оптимальный старт для музыкантов!\n\n✅ 1000 кредитов в месяц\n✅ 3 трека одновременно\n✅ HD качество звука\n✅ Приоритетная генерация\n✅ Расширенные стили\n✅ Stem-сепарация (базовая)\n✅ Запись вокала\n✅ AI-помощник для текстов\n\n💎 Создавайте больше музыки с профессиональным качеством!",
    "en": "🥉 Optimal start for musicians!\n\n✅ 1000 credits per month\n✅ 3 tracks simultaneously\n✅ HD audio quality\n✅ Priority generation\n✅ Extended styles\n✅ Stem separation (basic)\n✅ Vocal recording\n✅ AI lyrics assistant\n\n💎 Create more music with professional quality!"
  }'::jsonb
WHERE code = 'basic';

UPDATE public.subscription_tiers SET 
  cover_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
  detailed_description = '{
    "ru": "🥈 Профессиональные инструменты!\n\n✅ 2250 кредитов в месяц\n✅ 5 треков одновременно\n✅ HD качество звука\n✅ Полная stem-сепарация\n✅ MIDI транскрипция\n✅ Гитарная студия\n✅ Prompt DJ\n✅ Все модели генерации\n✅ Приоритетная поддержка\n\n🚀 Всё для серьёзного музыкального продакшена!",
    "en": "🥈 Professional tools!\n\n✅ 2250 credits per month\n✅ 5 tracks simultaneously\n✅ HD audio quality\n✅ Full stem separation\n✅ MIDI transcription\n✅ Guitar studio\n✅ Prompt DJ\n✅ All generation models\n✅ Priority support\n\n🚀 Everything for serious music production!"
  }'::jsonb
WHERE code = 'pro';

UPDATE public.subscription_tiers SET 
  cover_url = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80',
  detailed_description = '{
    "ru": "🥇 Максимальные возможности!\n\n✅ 5000 кредитов в месяц\n✅ 10 треков одновременно\n✅ Ultra HD качество\n✅ Профессиональный мастеринг\n✅ Полный анализ + MIDI\n✅ Section Replace\n✅ Все премиум функции\n✅ Приоритетная поддержка 24/7\n\n👑 Лучший выбор для профессионалов и студий!",
    "en": "🥇 Maximum capabilities!\n\n✅ 5000 credits per month\n✅ 10 tracks simultaneously\n✅ Ultra HD quality\n✅ Professional mastering\n✅ Full analysis + MIDI\n✅ Section Replace\n✅ All premium features\n✅ Priority support 24/7\n\n👑 Best choice for professionals and studios!"
  }'::jsonb
WHERE code = 'premium';

UPDATE public.subscription_tiers SET 
  cover_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  detailed_description = '{
    "ru": "🏆 Корпоративное решение!\n\n✅ Безлимитные кредиты\n✅ Неограниченные треки\n✅ Полный API доступ\n✅ White-label решение\n✅ Выделенные серверы\n✅ SLA 99.9%\n✅ Кастомные AI модели\n✅ Персональный менеджер 24/7\n✅ Индивидуальные интеграции\n\n🤝 Свяжитесь с нами для обсуждения условий!",
    "en": "🏆 Enterprise solution!\n\n✅ Unlimited credits\n✅ Unlimited tracks\n✅ Full API access\n✅ White-label solution\n✅ Dedicated servers\n✅ SLA 99.9%\n✅ Custom AI models\n✅ Personal manager 24/7\n✅ Custom integrations\n\n🤝 Contact us to discuss terms!"
  }'::jsonb
WHERE code = 'enterprise';