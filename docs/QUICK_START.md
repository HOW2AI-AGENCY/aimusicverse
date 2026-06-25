# 🚀 Быстрый старт - MusicVerse AI

<div align="center">

<img src="../src/assets/logo.png" alt="MusicVerse AI Logo" width="120" />

**Начните создавать музыку с AI за 5 минут!**

</div>

---

## 📋 Содержание

- [Предварительные требования](#-предварительные-требования)
- [Шаг 1: Установка](#-шаг-1-установка)
- [Шаг 2: Конфигурация](#-шаг-2-конфигурация)
- [Шаг 3: Запуск](#-шаг-3-запуск)
- [Шаг 4: Первый трек](#-шаг-4-создайте-свой-первый-трек)
- [Следующие шаги](#-следующие-шаги)
- [Решение проблем](#-решение-проблем)

---

## 📦 Предварительные требования

Перед началом убедитесь, что у вас установлено:

| Требование  | Минимальная версия | Рекомендуемая | Проверка         |
| ----------- | ------------------ | ------------- | ---------------- |
| **Node.js** | 18.0.0             | 20.0.0+       | `node --version` |
| **npm**     | 9.0.0              | 10.0.0+       | `npm --version`  |
| **Git**     | 2.30.0             | latest        | `git --version`  |

### Установка Node.js

**macOS:**

```bash
brew install node
```

**Windows:**
Скачайте установщик с [nodejs.org](https://nodejs.org/)

**Linux:**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs
```

---

## 🔽 Шаг 1: Установка

### 1.1 Клонирование репозитория

```bash
# Клонируйте репозиторий
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git

# Перейдите в директорию проекта
cd aimusicverse
```

### 1.2 Установка зависимостей

```bash
# Установите все необходимые пакеты
npm install
```

⏱️ **Время установки:** ~2-3 минуты (зависит от скорости интернета)

**Ожидаемый результат:**

```
added 1035 packages, and audited 1036 packages in 2m
197 packages are looking for funding
```

---

## ⚙️ Шаг 2: Конфигурация

### 2.1 Создание файла окружения

```bash
# Скопируйте шаблон переменных окружения
cp .env.example .env.local
```

### 2.2 Настройка переменных

Откройте `.env.local` в текстовом редакторе и заполните необходимые поля:

```env
# Supabase Configuration (обязательно)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Telegram Bot Configuration (обязательно для Telegram Mini App)
VITE_TELEGRAM_BOT_NAME=your_bot_username
VITE_MINI_APP_URL=https://your-app-url/

# Optional - для продакшн
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

### 2.3 Где получить ключи?

#### Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект или используйте существующий
3. Перейдите в Settings → API
4. Скопируйте:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public Key → `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Telegram Bot

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте `/newbot` и следуйте инструкциям
3. Получите username бота → `VITE_TELEGRAM_BOT_NAME`
4. Настройте Mini App через BotFather

📖 **Подробнее:** [docs/TELEGRAM_BOT_ARCHITECTURE.md](TELEGRAM_BOT_ARCHITECTURE.md)

---

## 🚀 Шаг 3: Запуск

### 3.1 Запуск сервера разработки

```bash
npm run dev
```

**Ожидаемый результат:**

```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

### 3.2 Открытие в браузере

Откройте браузер и перейдите по адресу:

```
http://localhost:5173
```

🎉 **Поздравляем!** Приложение запущено!

---

## 🎵 Шаг 4: Создайте свой первый трек

### 4.1 Навигация

1. Откройте приложение в браузере: `http://localhost:5173`
2. Вы увидите главную страницу MusicVerse AI

### 4.2 Аутентификация (опционально)

**В режиме разработки:**

- Приложение работает в mock-режиме
- Не требуется реальная Telegram аутентификация
- Вы можете сразу начать создавать музыку

**Для Telegram Mini App:**

- Откройте бота в Telegram
- Нажмите кнопку "Open App"
- Аутентификация произойдет автоматически

### 4.3 Генерация трека

#### Вариант 1: Простая генерация

1. Нажмите кнопку **"Generate Music"** на главной странице
2. Введите промт (описание желаемой музыки):
   ```
   Энергичная электронная танцевальная музыка с запоминающимися хуками
   ```
3. Нажмите **"Generate"**
4. Дождитесь завершения генерации (~30-60 секунд)

#### Вариант 2: Продвинутая генерация

1. Перейдите в **Generate** → **Advanced**
2. Заполните детали:
   - **Title:** "Космическое путешествие"
   - **Prompt/Lyrics:**
     ```
     [Verse]
     Летим среди звезд
     [Chorus]
     Космически высоко
     ```
   - **Style:** "Electronic Ambient, Ethereal, Dreamy"
   - **Model:** "chirp-crow" (Suno AI v5)
3. Настройте параметры:
   - Instrumental: Да/Нет
   - Duration: 2-4 минуты
4. Нажмите **"Generate"**

### 4.4 Прослушивание трека

После завершения генерации:

1. Трек появится в вашей **Library**
2. Нажмите на трек для воспроизведения
3. Используйте плеер:
   - ▶️ Play/Pause
   - ⏭️ Next track
   - 🔀 Shuffle
   - 🔁 Repeat

---

## 📚 Следующие шаги

### Изучите возможности

#### 🎛️ Мета-теги Suno

Используйте 174+ мета-тегов для точного контроля:

- 📖 [docs/META_TAGS.md](META_TAGS.md)

#### 🎸 Музыкальные стили

Исследуйте 277+ доступных стилей:

- 📖 [docs/STYLES.md](STYLES.md)

#### 🌍 Языки

Создавайте музыку на 75+ языках:

- 📖 [docs/LANGUAGES.md](LANGUAGES.md)

### Продвинутые функции

#### 🎚️ Разделение стемов

Извлекайте отдельные инструменты из треков

#### 📁 Проекты

Организуйте треки в альбомы и EP

#### 🎨 Персоны

Создавайте AI-персоны для консистентного стиля

#### 🤖 AI Ассистент

Используйте AI для помощи в создании музыки

---

## 🛠️ Разработка

### Команды для разработки

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшн
npm run build

# Предпросмотр продакшн сборки
npm run preview

# Запуск тестов
npm test

# Проверка кода (lint)
npm run lint

# Форматирование кода
npm run format

# Проверка типов TypeScript
npm run type-check
```

### Структура проекта

```
aimusicverse/
├── src/
│   ├── components/    # React компоненты
│   ├── pages/         # Страницы приложения
│   ├── hooks/         # Кастомные хуки
│   ├── services/      # Сервисы (API, auth)
│   ├── utils/         # Утилиты
│   └── main.tsx       # Точка входа
├── public/            # Статические файлы
├── docs/              # Документация
└── supabase/          # Backend конфигурация
```

---

## ❓ Решение проблем

### Проблема: Порт 5173 уже занят

**Решение:**

```bash
# Используйте другой порт
npm run dev -- --port 3000
```

### Проблема: Module not found

**Решение:**

```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

### Проблема: TypeScript ошибки

**Решение:**

```bash
# Проверьте версию TypeScript
npm list typescript

# Переустановите зависимости
npm install
```

### Проблема: Ошибка при сборке

**Решение:**

```bash
# Очистите кэш и пересоберите
rm -rf dist
npm run build
```

### Проблема: Supabase connection failed

**Проверьте:**

1. Правильность URL и ключа в `.env.local`
2. Доступность Supabase проекта
3. Настройки CORS в Supabase

---

## 🆘 Получение помощи

### Документация

- 📖 [Полная документация](INDEX.md)
- 🏗️ [Архитектура](ARCHITECTURE.md)
- 📡 [API Reference](API.md)
- 🐛 [Troubleshooting](PLAYER_TROUBLESHOOTING.md)

### Сообщество

- 💬 [GitHub Discussions](https://github.com/HOW2AI-AGENCY/aimusicverse/discussions)
- 🐛 [Сообщить о проблеме](https://github.com/HOW2AI-AGENCY/aimusicverse/issues)
- 📧 [Email Support](mailto:support@musicverse.ai)
- 💬 [Telegram Support](https://t.me/MusicVerseSupport)

### Участие

- 🤝 [Contributing Guide](../CONTRIBUTING.md)
- 📋 [Code of Conduct](../CODE_OF_CONDUCT.md)

---

## 🎉 Готово!

Теперь вы готовы создавать потрясающую музыку с помощью MusicVerse AI!

### Полезные ссылки

| Ссылка                                | Описание               |
| ------------------------------------- | ---------------------- |
| [🏠 README](../README.md)             | Главная страница       |
| [📖 Документация](INDEX.md)           | Полная документация    |
| [🤝 Contributing](../CONTRIBUTING.md) | Руководство по участию |
| [🎯 Roadmap](../ROADMAP.md)           | Планы развития         |
| [📝 Changelog](../CHANGELOG.md)       | История изменений      |

---

<div align="center">

**Создавайте музыку. Делитесь эмоциями. Вдохновляйте мир.**

[![Открыть в Telegram](https://img.shields.io/badge/🚀%20Открыть%20в%20Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](http://t.me/musicverse_ai_bot/app)

---

Made with ❤️ by the MusicVerse AI Team

[⬆️ Вернуться наверх](#-быстрый-старт---musicverse-ai)

</div>
