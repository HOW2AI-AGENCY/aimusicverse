-- Update existing menu items with rich captions and descriptions
UPDATE public.telegram_menu_items SET 
  caption = E'ℹ️ *MusicVerse AI* — платформа для создания музыки с помощью искусственного интеллекта\\.\n\n🎵 Генерируйте треки за минуты\n🎤 Создавайте каверы голосом\n🎛️ Разделяйте на стемы\n🎹 Экспортируйте в MIDI\n\n_Узнайте больше о нас:_',
  description = 'О платформе MusicVerse AI'
WHERE menu_key = 'about';

UPDATE public.telegram_menu_items SET 
  caption = E'💰 *ТАРИФЫ*\n\nВыберите подходящий тариф для ваших потребностей:\n\n🆓 *Бесплатный* — 5 кредитов/день\n⭐ *Базовый* — 50 кредитов/мес\n🚀 *Профессионал* — безлимит\n\n_Сравните возможности:_',
  description = 'Тарифные планы и подписки'
WHERE menu_key = 'tariffs';

UPDATE public.telegram_menu_items SET 
  caption = E'🎵 *МОИ ТРЕКИ*\n\nВаша музыкальная библиотека\\. Здесь хранятся все созданные треки\\.\n\n📊 Фильтруйте по жанрам и настроению\n⭐ Добавляйте в избранное\n🔍 Используйте поиск\n\n_Управляйте коллекцией:_',
  description = 'Библиотека созданных треков'
WHERE menu_key = 'tracks';

UPDATE public.telegram_menu_items SET 
  caption = E'📁 *ПРОЕКТЫ*\n\nОрганизуйте музыку в альбомы и EP\\.\n\n🎨 Создавайте обложки\n📝 Храните тексты\n🎼 Объединяйте треки\n\n_Ваши проекты:_',
  description = 'Музыкальные проекты и альбомы'
WHERE menu_key = 'projects';

UPDATE public.telegram_menu_items SET 
  caption = E'👤 *ПРОФИЛЬ*\n\nНастройки аккаунта и статистика\\.\n\n📊 Статистика генераций\n💳 Управление подпиской\n⚙️ Настройки уведомлений\n\n_Ваш профиль:_',
  description = 'Настройки профиля и статистика'
WHERE menu_key = 'profile';

UPDATE public.telegram_menu_items SET 
  caption = E'📚 *РУКОВОДСТВА*\n\nПолезные инструкции для работы с ботом\\.\n\n🚀 Быстрый старт\n🎵 Генерация музыки\n✍️ Написание текстов\n❓ Частые вопросы\n\n_Выберите раздел:_',
  description = 'Инструкции и справочные материалы'
WHERE menu_key = 'guides';

UPDATE public.telegram_menu_items SET 
  caption = E'📤 *ЗАГРУЗКА*\n\nЗагрузите материалы для обработки\\.\n\n🎵 Аудиофайлы для анализа\n🎤 Голосовые для кавера\n📝 Тексты песен\n🎨 Обложки\n\n_Выберите тип:_',
  description = 'Загрузка файлов и материалов'
WHERE menu_key = 'upload';

UPDATE public.telegram_menu_items SET 
  caption = E'☁️ *ОБЛАКО*\n\nВаше облачное хранилище\\.\n\n📂 Загруженные файлы\n🎛️ Разделённые стемы\n🎹 MIDI файлы\n📊 Статистика хранилища\n\n_Управляйте файлами:_',
  description = 'Облачное хранилище файлов'
WHERE menu_key = 'cloud';

UPDATE public.telegram_menu_items SET 
  caption = E'💬 *ОБРАТНАЯ СВЯЗЬ*\n\nСвяжитесь с нами\\!\n\n🛠 Техническая поддержка\n🐛 Сообщить об ошибке\n💡 Предложить идею\n⭐ Оценить бота\n\n_Как мы можем помочь?_',
  description = 'Связь с поддержкой'
WHERE menu_key = 'feedback';

-- Insert nested menu items for О НАС (about)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('about_company', 'about', 'О компании', '🏢', E'🏢 *О КОМПАНИИ*\n\nMusicVerse AI — инновационный стартап в сфере AI\\-музыки\\.\n\n📅 Основан в 2024 году\n👥 Команда энтузиастов\n🌍 Глобальная миссия\n\n_Мы делаем музыку доступной каждому\\!_', 'message', NULL, 1, 0, true),
  ('about_technology', 'about', 'Технологии', '🔬', E'🔬 *ТЕХНОЛОГИИ*\n\n⚡ *Suno AI* — генерация музыки\n🎛️ *Demucs* — разделение стемов\n🎹 *Klangio* — MIDI транскрипция\n🧠 *Gemini* — анализ аудио\n\n_Передовые AI технологии\\!_', 'message', NULL, 2, 0, true),
  ('about_team', 'about', 'Наша команда', '👥', E'👥 *НАША КОМАНДА*\n\nМы — команда музыкантов, разработчиков и AI\\-энтузиастов\\.\n\n🎸 Создатели с опытом\n💻 Инженеры с душой\n🎵 Любители музыки\n\n_Работаем для вас\\!_', 'message', NULL, 3, 0, true),
  ('about_contacts', 'about', 'Контакты', '📞', E'📞 *КОНТАКТЫ*\n\n📧 Email: support@musicverse\\.ai\n📱 Telegram: @MusicVerseSupport\n🌐 Сайт: musicverse\\.ai\n\n_Мы всегда на связи\\!_', 'message', NULL, 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ТАРИФЫ (tariffs)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('tariff_free', 'tariffs', 'Бесплатный', '🆓', E'🆓 *БЕСПЛАТНЫЙ ТАРИФ*\n\nИдеален для знакомства с платформой\\.\n\n✅ 5 кредитов в день\n✅ Базовая генерация\n✅ 10 треков в библиотеке\n❌ Приоритетная очередь\n\n_Начните бесплатно\\!_', 'callback', 'tariff_select_free', 1, 0, true),
  ('tariff_basic', 'tariffs', 'Базовый', '⭐', E'⭐ *БАЗОВЫЙ ТАРИФ*\n\n*299 ⭐ Stars / месяц*\n\n✅ 50 кредитов в месяц\n✅ Расширенная генерация\n✅ 100 треков в библиотеке\n✅ Приоритетная очередь\n❌ Коммерческое использование\n\n_Оптимальный выбор\\!_', 'callback', 'tariff_select_basic', 2, 0, true),
  ('tariff_pro', 'tariffs', 'Профессионал', '🚀', E'🚀 *ПРОФЕССИОНАЛ*\n\n*999 ⭐ Stars / месяц*\n\n✅ Безлимитные кредиты\n✅ Все функции\n✅ Безлимитное хранилище\n✅ Максимальный приоритет\n✅ Коммерческое использование\n\n_Для серьёзной работы\\!_', 'callback', 'tariff_select_pro', 3, 0, true),
  ('tariff_compare', 'tariffs', 'Сравнить тарифы', '📊', E'📊 *СРАВНЕНИЕ ТАРИФОВ*\n\nОткройте подробную таблицу сравнения всех тарифов в веб\\-приложении\\.', 'webapp', 'tariffs', 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ТРЕКИ (tracks)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('tracks_all', 'tracks', 'Все треки', '🎵', NULL, 'callback', 'tracks_list_all', 1, 0, true),
  ('tracks_recent', 'tracks', 'Недавние', '🕐', NULL, 'callback', 'tracks_list_recent', 2, 0, true),
  ('tracks_favorites', 'tracks', 'Избранное', '⭐', NULL, 'callback', 'tracks_list_favorites', 3, 1, true),
  ('tracks_genres', 'tracks', 'По жанрам', '🎸', NULL, 'callback', 'tracks_filter_genres', 4, 1, true),
  ('tracks_search', 'tracks', 'Поиск', '🔍', NULL, 'callback', 'tracks_search', 5, 2, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ПРОЕКТЫ (projects)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('projects_all', 'projects', 'Все проекты', '📁', NULL, 'callback', 'projects_list_all', 1, 0, true),
  ('projects_active', 'projects', 'Активные', '🟢', NULL, 'callback', 'projects_list_active', 2, 0, true),
  ('projects_archive', 'projects', 'Архив', '📦', NULL, 'callback', 'projects_list_archive', 3, 1, true),
  ('projects_create', 'projects', 'Создать проект', '➕', E'➕ *СОЗДАТЬ ПРОЕКТ*\n\nНачните новый музыкальный проект:\n\n📝 Введите название\n🎨 Выберите жанр\n🎵 Добавляйте треки\n\n_Ваш новый альбом ждёт\\!_', 'callback', 'project_create_new', 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ПРОФИЛЬ (profile)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('profile_stats', 'profile', 'Статистика', '📊', NULL, 'callback', 'profile_show_stats', 1, 0, true),
  ('profile_subscription', 'profile', 'Подписка', '💳', NULL, 'callback', 'profile_subscription', 2, 0, true),
  ('profile_settings', 'profile', 'Настройки', '⚙️', NULL, 'webapp', 'settings', 3, 1, true),
  ('profile_achievements', 'profile', 'Достижения', '🏆', NULL, 'callback', 'profile_achievements', 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ЗАГРУЗКА (upload)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('upload_audio', 'upload', 'Загрузить аудио', '🎵', E'🎵 *ЗАГРУЗКА АУДИО*\n\nОтправьте аудиофайл для обработки\\.\n\n📎 Поддерживаемые форматы: MP3, WAV, OGG, M4A\n📏 Максимальный размер: 50 MB\n⏱ Максимальная длина: 10 минут\n\n_Отправьте аудиофайл в чат\\.\\.\\._', 'callback', 'upload_audio_prompt', 1, 0, true),
  ('upload_voice', 'upload', 'Голосовое', '🎤', E'🎤 *ГОЛОСОВОЕ СООБЩЕНИЕ*\n\nЗапишите голосовое для создания кавера или транскрипции\\.\n\n🎵 Напойте мелодию\n📝 Надиктуйте текст\n🎸 Сыграйте на инструменте\n\n_Отправьте голосовое сообщение\\.\\.\\._', 'callback', 'upload_voice_prompt', 2, 0, true),
  ('upload_lyrics', 'upload', 'Загрузить текст', '📝', E'📝 *ЗАГРУЗКА ТЕКСТА*\n\nОтправьте текст песни для генерации\\.\n\n✍️ Готовые стихи\n🎵 Текст с разметкой секций\n📄 TXT файл\n\n_Отправьте текст в чат\\.\\.\\._', 'callback', 'upload_lyrics_prompt', 3, 1, true),
  ('upload_cover', 'upload', 'Создать кавер', '🎭', E'🎭 *СОЗДАНИЕ КАВЕРА*\n\nЗагрузите трек для создания AI\\-кавера\\.\n\n🎵 Оригинальный трек\n🎤 Новый голос и стиль\n✨ AI обработка\n\n_Отправьте аудиофайл\\.\\.\\._', 'callback', 'upload_cover_prompt', 4, 1, true),
  ('upload_extend', 'upload', 'Расширить трек', '➕', E'➕ *РАСШИРЕНИЕ ТРЕКА*\n\nПродлите существующий трек\\.\n\n🎵 Загрузите трек\n⏱ Добавим продолжение\n🎼 Сохраним стиль\n\n_Отправьте аудиофайл\\.\\.\\._', 'callback', 'upload_extend_prompt', 5, 2, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ОБЛАКО (cloud)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('cloud_files', 'cloud', 'Мои файлы', '📂', NULL, 'callback', 'cloud_list_files', 1, 0, true),
  ('cloud_stems', 'cloud', 'Стемы', '🎛️', NULL, 'callback', 'cloud_list_stems', 2, 0, true),
  ('cloud_midi', 'cloud', 'MIDI файлы', '🎹', NULL, 'callback', 'cloud_list_midi', 3, 1, true),
  ('cloud_storage', 'cloud', 'Хранилище', '📊', E'📊 *ХРАНИЛИЩЕ*\n\nИнформация о вашем облачном пространстве\\.\n\n💾 Используется: X MB\n📁 Файлов: Y\n⬆️ Лимит: Z MB\n\n_Управляйте пространством\\!_', 'callback', 'cloud_storage_info', 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Insert nested menu items for ОБРАТНАЯ СВЯЗЬ (feedback)
INSERT INTO public.telegram_menu_items (menu_key, parent_key, title, icon_emoji, caption, action_type, action_data, sort_order, row_position, is_enabled)
VALUES 
  ('feedback_support', 'feedback', 'Техподдержка', '🛠', E'🛠 *ТЕХПОДДЕРЖКА*\n\nОпишите вашу проблему, и мы поможем\\!\n\n📧 Ответим в течение 24 часов\n🔧 Решим технические проблемы\n💡 Подскажем как пользоваться\n\n_Напишите ваш вопрос\\.\\.\\._', 'callback', 'feedback_support_prompt', 1, 0, true),
  ('feedback_bug', 'feedback', 'Сообщить об ошибке', '🐛', E'🐛 *СООБЩИТЬ ОБ ОШИБКЕ*\n\nПомогите нам стать лучше\\!\n\n📝 Опишите ошибку\n📸 Приложите скриншот\n🔄 Укажите шаги воспроизведения\n\n_Опишите проблему\\.\\.\\._', 'callback', 'feedback_bug_prompt', 2, 0, true),
  ('feedback_idea', 'feedback', 'Предложить идею', '💡', E'💡 *ПРЕДЛОЖИТЬ ИДЕЮ*\n\nМы открыты к предложениям\\!\n\n🚀 Новые функции\n🎨 Улучшения интерфейса\n🎵 Музыкальные фишки\n\n_Расскажите вашу идею\\.\\.\\._', 'callback', 'feedback_idea_prompt', 3, 1, true),
  ('feedback_rate', 'feedback', 'Оценить бота', '⭐', E'⭐ *ОЦЕНИТЬ БОТА*\n\nВаша оценка помогает нам развиваться\\!\n\n1️⃣ — Плохо\n2️⃣ — Средне\n3️⃣ — Хорошо\n4️⃣ — Отлично\n5️⃣ — Превосходно\\!\n\n_Выберите оценку:_', 'callback', 'feedback_rate_prompt', 4, 1, true)
ON CONFLICT (menu_key) DO UPDATE SET 
  parent_key = EXCLUDED.parent_key,
  title = EXCLUDED.title,
  icon_emoji = EXCLUDED.icon_emoji,
  caption = EXCLUDED.caption,
  action_type = EXCLUDED.action_type,
  action_data = EXCLUDED.action_data,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;