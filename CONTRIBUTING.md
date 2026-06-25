<div align="center">

<img src="src/assets/logo.png" alt="MusicVerse AI Logo" width="120" />

# 🤝 Руководство по участию в проекте

### Спасибо, что хотите внести вклад в MusicVerse AI!

Мы рады вашему вкладу и ценим каждого участника. Чтобы сделать процесс разработки прозрачным и эффективным, пожалуйста, следуйте этим правилам.

[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Read-blue.svg)](CODE_OF_CONDUCT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[📖 Документация](docs/INDEX.md) • [🐛 Report Bug](https://github.com/HOW2AI-AGENCY/aimusicverse/issues/new?template=bug_report.md) • [✨ Request Feature](https://github.com/HOW2AI-AGENCY/aimusicverse/issues/new?template=feature_request.md)

</div>

---

## 📑 Содержание

- [🎯 Способы участия](#-способы-участия)
- [🚀 Первые шаги](#-первые-шаги)
- [🔄 Рабочий процесс](#-рабочий-процесс)
- [💻 Стиль кода](#-стиль-кода)
- [📝 Сообщения коммитов](#-сообщения-коммитов)
- [✅ Pull Request процесс](#-pull-request-процесс)
- [🧪 Тестирование](#-тестирование)
- [📚 Документация](#-документация)
- [🎨 UI/UX Guidelines](#-uiux-guidelines)
- [🔐 Безопасность](#-безопасность)
- [💬 Коммуникация](#-коммуникация)

---

## 🎯 Способы участия

Есть много способов внести вклад в MusicVerse AI:

### 👨‍💻 Разработка кода

- 🐛 **Исправление багов** - Помогите исправить проблемы
- ✨ **Новые функции** - Реализуйте новый функционал
- ⚡ **Оптимизация** - Улучшите производительность
- ♻️ **Рефакторинг** - Улучшите качество кода

### 📚 Документация

- 📝 **Написание документации** - Создайте или улучшите docs
- 🌐 **Перевод** - Помогите с локализацией
- 📖 **Туториалы** - Создайте обучающие материалы
- 📸 **Примеры** - Добавьте примеры использования

### 🎨 Дизайн

- 🖌️ **UI/UX дизайн** - Улучшите интерфейс
- 🎭 **Анимации** - Создайте плавные переходы
- 🌈 **Темы** - Разработайте новые цветовые схемы
- 📱 **Мобильный дизайн** - Оптимизируйте для mobile

### 🧪 Тестирование

- ✅ **Написание тестов** - Увеличьте покрытие
- 🔍 **QA тестирование** - Найдите и сообщите о багах
- 📊 **Performance тестирование** - Проверьте производительность

### 💬 Сообщество

- 🆘 **Поддержка пользователей** - Помогайте другим
- 📢 **Распространение** - Расскажите о проекте
- 💡 **Идеи** - Предложите улучшения
- 📝 **Отзывы** - Поделитесь своим опытом

---

## 🚀 Первые шаги

### 1. 🍴 Fork репозитория

Нажмите кнопку "Fork" в правом верхнем углу страницы GitHub.

### 2. 📥 Клонируйте ваш fork

```bash
git clone https://github.com/ваш-username/aimusicverse.git
cd aimusicverse
```

### 3. 🔗 Настройте upstream

```bash
git remote add upstream https://github.com/HOW2AI-AGENCY/aimusicverse.git
```

### 4. 📦 Установите зависимости

```bash
npm install
```

### 5. 🔐 Настройте переменные окружения

```bash
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками
```

### 6. 🚀 Запустите проект

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

---

## 🔄 Рабочий процесс

Мы используем **GitFlow** для управления ветками. Подробный процесс описан в [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

### Структура веток

```
main (production)
  └── develop (integration)
       ├── feature/новая-функция
       ├── bugfix/исправление-бага
       └── hotfix/срочное-исправление
```

### Пошаговый процесс

#### 1️⃣ Синхронизируйте с upstream

```bash
git checkout develop
git fetch upstream
git merge upstream/develop
```

#### 2️⃣ Создайте ветку для работы

```bash
# Для новой функции
git checkout -b feature/название-функции

# Для исправления бага
git checkout -b bugfix/описание-бага

# Для hotfix (от main)
git checkout main
git checkout -b hotfix/критическое-исправление
```

#### 3️⃣ Разработка

```bash
# Делайте изменения, коммитьте часто
git add .
git commit -m "feat(scope): описание изменений"

# Синхронизируйтесь с develop периодически
git fetch upstream
git rebase upstream/develop
```

#### 4️⃣ Тестирование

```bash
# Запустите тесты
npm test

# Проверьте линтинг
npm run lint

# Сборка
npm run build
```

#### 5️⃣ Push и создание PR

```bash
# Push в ваш fork
git push origin feature/название-функции

# Создайте Pull Request на GitHub в ветку develop
```

#### 6️⃣ Code Review

- Дождитесь ревью от команды
- Отвечайте на комментарии
- Вносите необходимые изменения
- После одобрения ваш PR будет смержен

---

## 💻 Стиль кода

Мы строго следуем стандартам качества кода для поддержания консистентности проекта.

### 🎨 Форматирование

**Prettier** автоматически форматирует код. Настройки в `.prettierrc.json`.

```bash
# Форматировать все файлы
npm run format

# Проверить форматирование
npm run format -- --check
```

### 🔍 Линтинг

**ESLint** проверяет качество кода. Настройки в `eslint.config.js`.

```bash
# Проверить код
npm run lint

# Автоматически исправить проблемы
npm run lint -- --fix
```

### 📝 Именование

| Тип                    | Стиль              | Примеры                             |
| ---------------------- | ------------------ | ----------------------------------- |
| **Компоненты**         | `PascalCase`       | `BottomNavigation`, `MusicPlayer`   |
| **Функции/Переменные** | `camelCase`        | `telegramUser`, `handlePlayback`    |
| **Типы/Интерфейсы**    | `PascalCase`       | `TelegramUser`, `MusicTrack`        |
| **Константы**          | `UPPER_SNAKE_CASE` | `MAX_PROMPT_LENGTH`, `API_BASE_URL` |
| **Файлы компонентов**  | `PascalCase.tsx`   | `Button.tsx`, `AudioPlayer.tsx`     |
| **Файлы утилит**       | `camelCase.ts`     | `formatDate.ts`, `apiClient.ts`     |

### 🏗️ Структура файлов

```typescript
// 1. Импорты - внешние библиотеки
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Импорты - внутренние абсолютные
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';

// 3. Импорты - относительные
import { formatDuration } from './utils';
import type { Track } from './types';

// 4. Импорты - стили
import './styles.css';

// 5. Типы
interface Props {
  track: Track;
  onPlay: () => void;
}

// 6. Компонент
export const TrackCard = ({ track, onPlay }: Props) => {
  // Хуки
  const { user } = useTelegram();
  const [isPlaying, setIsPlaying] = useState(false);

  // Эффекты
  useEffect(() => {
    // ...
  }, []);

  // Обработчики
  const handleClick = () => {
    // ...
  };

  // Рендер
  return (
    // JSX
  );
};
```

### ⚛️ React Best Practices

- ✅ Используйте функциональные компоненты с хуками
- ✅ Следуйте [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- ✅ Используйте `React.memo()` для оптимизации
- ✅ Предпочитайте композицию наследованию
- ✅ Держите компоненты маленькими и сфокусированными
- ❌ Не используйте классовые компоненты
- ❌ Избегайте глубокой вложенности пропсов

### 📘 TypeScript

- ✅ Всегда указывайте типы явно
- ✅ Используйте `interface` для объектов
- ✅ Используйте `type` для union/intersection types
- ❌ Избегайте `any` - используйте `unknown` если нужно
- ❌ Не отключайте TypeScript проверки

```typescript
// ✅ Хорошо
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// ❌ Плохо
const getUser = (id: any): any => {
  // ...
};
```

---

## 📝 Сообщения коммитов

Мы следуем [Conventional Commits](https://www.conventionalcommits.org/ru/) для автоматической генерации changelog.

### Формат

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Типы коммитов

| Тип        | Описание           | Пример                                    |
| ---------- | ------------------ | ----------------------------------------- |
| `feat`     | Новая функция      | `feat(player): add shuffle mode`          |
| `fix`      | Исправление бага   | `fix(auth): resolve token expiration`     |
| `docs`     | Документация       | `docs(readme): update installation steps` |
| `style`    | Форматирование     | `style(button): fix spacing`              |
| `refactor` | Рефакторинг        | `refactor(api): simplify error handling`  |
| `test`     | Тесты              | `test(player): add playback tests`        |
| `chore`    | Другое             | `chore(deps): update dependencies`        |
| `perf`     | Производительность | `perf(library): optimize track loading`   |
| `ci`       | CI/CD              | `ci(github): add code coverage`           |

### Примеры

```bash
# Новая функция
feat(generate): add custom duration selection

# Исправление бага
fix(player): resolve audio stuttering on iOS

# Документация
docs(contributing): add code style guidelines

# Breaking change
feat(api)!: change authentication flow

BREAKING CHANGE: JWT tokens are now required for all requests
```

### Scope (область)

Используйте scope для указания затронутой части:

- `auth` - аутентификация
- `player` - аудио плеер
- `library` - библиотека треков
- `generate` - генерация музыки
- `ui` - пользовательский интерфейс
- `api` - API интеграция

---

## 📌 Комментарии в коде

### TODO и FIXME

Наша CI система автоматически создает Issues из специальных комментариев:

```typescript
// TODO: Добавить поддержку плейлистов
// FIXME: Исправить memory leak в audio player
// HACK: Временное решение для Safari
// NOTE: Важная информация для будущих разработчиков
```

### JSDoc комментарии

Документируйте публичные функции и компоненты:

````typescript
/**
 * Генерирует музыкальный трек с помощью Suno AI
 *
 * @param prompt - Текстовое описание трека
 * @param options - Дополнительные параметры генерации
 * @returns Promise с сгенерированным треком
 * @throws {APIError} Если генерация не удалась
 *
 * @example
 * ```typescript
 * const track = await generateTrack(
 *   "Upbeat electronic dance music",
 *   { instrumental: false }
 * );
 * ```
 */
export async function generateTrack(prompt: string, options?: GenerateOptions): Promise<Track> {
  // ...
}
````

---

## ✅ Pull Request процесс

### Перед созданием PR

- [ ] Код проходит все тесты: `npm test`
- [ ] Код проходит линтинг: `npm run lint`
- [ ] Код отформатирован: `npm run format`
- [ ] Build успешен: `npm run build`
- [ ] Документация обновлена (если нужно)
- [ ] CHANGELOG.md обновлен (для значимых изменений)

### Создание PR

1. **Используйте шаблон PR** - GitHub автоматически предложит шаблон
2. **Напишите описательное название** - следуйте формату коммитов
3. **Заполните все секции** - описание, тесты, скриншоты
4. **Свяжите Issues** - используйте `Fixes #123` или `Closes #456`
5. **Добавьте reviewers** - отметьте нужных людей
6. **Установите labels** - bug, feature, documentation и т.д.

### Во время ревью

- ✅ Отвечайте на комментарии быстро
- ✅ Будьте открыты к обратной связи
- ✅ Обсуждайте, но не спорьте
- ✅ Вносите запрошенные изменения
- ✅ Помечайте разрешенные комментарии

### После одобрения

- PR будет смержен maintainers
- Ваша ветка будет удалена
- Вы получите упоминание в CHANGELOG
- 🎉 Празднуйте ваш вклад!

---

## 🧪 Тестирование

### Типы тестов

#### Unit тесты

```bash
# Запустить все тесты
npm test

# Запустить с coverage
npm run test:coverage

# Запустить в watch mode
npm test -- --watch

# Запустить конкретный тест
npm test -- TrackCard.test.tsx
```

#### E2E тесты (Playwright)

```bash
# Установить браузеры
npx playwright install

# Запустить E2E тесты
npm run test:e2e

# Запустить в UI mode
npm run test:e2e -- --ui
```

### Покрытие кода

Минимальное покрытие:

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### Что тестировать

✅ **Обязательно:**

- Новые функции и компоненты
- Исправления багов
- Критичная бизнес-логика
- Утилиты и хелперы

❌ **Опционально:**

- UI компоненты (визуальные)
- Простые геттеры/сеттеры
- Типы TypeScript

### Пример теста

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackCard } from './TrackCard';

describe('TrackCard', () => {
  it('should render track information', () => {
    const track = {
      id: '1',
      title: 'Test Track',
      artist: 'Test Artist'
    };

    render(<TrackCard track={track} />);

    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should call onPlay when play button clicked', () => {
    const onPlay = jest.fn();
    const track = { id: '1', title: 'Test' };

    render(<TrackCard track={track} onPlay={onPlay} />);

    fireEvent.click(screen.getByRole('button', { name: /play/i }));

    expect(onPlay).toHaveBeenCalledWith('1');
  });
});
```

---

## 📚 Документация

### Что документировать

- ✅ Публичные API и функции
- ✅ Сложные алгоритмы
- ✅ Архитектурные решения (ADR)
- ✅ Настройка и установка
- ✅ Примеры использования

### Где документировать

| Тип                  | Где                               |
| -------------------- | --------------------------------- |
| **API документация** | JSDoc комментарии + `docs/API.md` |
| **Компоненты**       | Storybook + JSDoc                 |
| **Архитектура**      | `docs/ARCHITECTURE.md`            |
| **Руководства**      | `docs/guides/`                    |
| **Changelog**        | `CHANGELOG.md`                    |

### Стиль документации

```markdown
# Название

Краткое описание что это и зачем.

## Использование

Как использовать с примерами кода.

## API Reference

Детальное описание API.

## Примеры

Практические примеры.

## См. также

Ссылки на связанную документацию.
```

---

## 🎨 UI/UX Guidelines

### Дизайн-система

Мы используем **shadcn/ui** как основу. Следуйте этим принципам:

#### Spacing (отступы)

- Используйте Tailwind spacing scale: `p-4`, `m-2`, `gap-6`
- Консистентные отступы между элементами
- Mobile-first подход

#### Colors (цвета)

- Используйте CSS variables из `globals.css`
- Dark/Light mode поддержка обязательна
- Контраст текста должен быть WCAG AA совместимым

#### Typography (типографика)

- Используйте определенные классы: `text-lg`, `font-semibold`
- Иерархия заголовков: `h1` → `h6`
- Читаемые размеры шрифтов (минимум 14px)

#### Components (компоненты)

- Переиспользуйте существующие из `src/components/ui/`
- Создавайте новые только если нужно
- Документируйте в Storybook

### Responsive Design

```tsx
// Mobile-first подход
<div
  className="
  p-4          // mobile
  md:p-6       // tablet
  lg:p-8       // desktop
"
>
  <h1
    className="
    text-2xl    // mobile
    md:text-3xl // tablet
    lg:text-4xl // desktop
  "
  >
    Title
  </h1>
</div>
```

### Accessibility (a11y)

- ✅ Используйте семантические HTML теги
- ✅ Добавляйте `aria-label` для кнопок-иконок
- ✅ Keyboard navigation должна работать
- ✅ Focus states должны быть видимы
- ✅ Контраст цветов WCAG AA

---

## 🔐 Безопасность

### Что НЕ делать

❌ **Никогда не коммитьте:**

- API ключи и токены
- Пароли и credentials
- Личные данные пользователей
- `.env` файлы
- Секреты любого рода

### Best Practices

✅ **Всегда:**

- Используйте переменные окружения
- Валидируйте пользовательский ввод
- Санитизируйте данные перед отображением
- Используйте HTTPS для API запросов
- Следуйте принципу наименьших привилегий

### Если нашли уязвимость

🔒 **НЕ создавайте публичный Issue!**

Следуйте [политике безопасности](SECURITY.md):

1. Отправьте email на security@musicverse.ai
2. Или используйте GitHub Security Advisory
3. Опишите проблему детально
4. Дождитесь ответа от команды

---

## 💬 Коммуникация

### Каналы связи

| Канал                     | Для чего                        |
| ------------------------- | ------------------------------- |
| 💬 **GitHub Discussions** | Вопросы, идеи, общение          |
| 🐛 **GitHub Issues**      | Баги, задачи, feature requests  |
| 📝 **Pull Requests**      | Code review, обсуждение кода    |
| 📧 **Email**              | Приватные вопросы, безопасность |
| 💬 **Telegram**           | Быстрая помощь, сообщество      |

### Этикет

✅ **Делайте:**

- Будьте вежливы и уважительны
- Помогайте новичкам
- Давайте конструктивную обратную связь
- Благодарите за помощь
- Признавайте свои ошибки

❌ **Не делайте:**

- Не используйте грубый язык
- Не атакуйте людей
- Не спамьте
- Не требуйте немедленного ответа

### Вопросы и помощь

**Перед тем как задать вопрос:**

1. 🔍 Проверьте [FAQ](docs/FAQ.md)
2. 🔍 Ищите в Issues
3. 🔍 Проверьте [документацию](docs/INDEX.md)
4. 🔍 Google it

**При создании вопроса:**

- Используйте descriptive title
- Предоставьте контекст
- Включите код примеры
- Добавьте скриншоты если нужно
- Укажите версии (ОС, браузер, и т.д.)

---

## 🏆 Признание контрибьюторов

Мы ценим каждый вклад! Ваше участие будет отмечено:

- 📝 **В CHANGELOG.md** - при релизах
- 👥 **В CONTRIBUTORS.md** - список участников
- 🎖️ **GitHub profile** - контрибьюторские бэджи
- 💬 **Mentions** - в релиз нотах
- 🎁 **Swag** - для значительных вкладов

### Уровни участия

| Уровень            | Критерии         | Бенефиты                  |
| ------------------ | ---------------- | ------------------------- |
| 🌱 **Новичок**     | 1-5 merged PRs   | Упоминание в README       |
| 🌿 **Активный**    | 6-20 merged PRs  | Beta доступ, Discord role |
| 🌳 **Продвинутый** | 21-50 merged PRs | Premium features, swag    |
| 🎖️ **Core**        | 50+ merged PRs   | Maintainer права          |

---

## 📋 Чеклист контрибьютора

Используйте этот чеклист перед созданием PR:

### Код

- [ ] Код следует стайл-гайду
- [ ] Нет lint ошибок
- [ ] Код отформатирован Prettier
- [ ] TypeScript типы корректны
- [ ] Нет TODO/FIXME без Issues

### Тесты

- [ ] Добавлены unit тесты
- [ ] Все тесты проходят
- [ ] Coverage >= 80%
- [ ] Проверено в разных браузерах

### Документация

- [ ] JSDoc комментарии добавлены
- [ ] README обновлен (если нужно)
- [ ] CHANGELOG.md обновлен
- [ ] Примеры добавлены

### UI/UX

- [ ] Responsive design проверен
- [ ] Dark/Light mode работает
- [ ] Accessibility проверен
- [ ] Скриншоты добавлены в PR

### Безопасность

- [ ] Нет секретов в коде
- [ ] Input validation добавлена
- [ ] XSS защита проверена
- [ ] npm audit пройден

### Git

- [ ] Коммиты следуют Conventional Commits
- [ ] Ветка синхронизирована с develop
- [ ] Нет merge конфликтов
- [ ] История коммитов чистая

---

## 🎓 Ресурсы для изучения

### Для новичков

- [📖 React Tutorial](https://react.dev/learn)
- [📘 TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [🎨 Tailwind CSS Docs](https://tailwindcss.com/docs)
- [📱 Telegram Mini Apps](https://core.telegram.org/bots/webapps)

### Продвинутые темы

- [⚡ React Performance](https://react.dev/learn/render-and-commit)
- [🏗️ System Design](https://github.com/donnemartin/system-design-primer)
- [🔐 Web Security](https://owasp.org/www-project-top-ten/)
- [♿ Web Accessibility](https://www.w3.org/WAI/fundamentals/)

### Наши документы

- [🏗️ Архитектура](docs/ARCHITECTURE.md)
- [📖 API Reference](docs/API.md)
- [🗺️ Навигация](docs/NAVIGATION_SYSTEM.md)
- [🎯 Roadmap](ROADMAP.md)

---

## ❓ Часто задаваемые вопросы

### Я новичок в open source. С чего начать?

Отлично! Вот план действий:

1. Прочитайте этот документ полностью
2. Установите проект локально
3. Найдите Issues с меткой `good-first-issue`
4. Спросите в Discussions если нужна помощь
5. Создайте свой первый PR!

### Как мне выбрать задачу?

Ищите Issues с метками:

- `good-first-issue` - для начинающих
- `help-wanted` - требуется помощь
- `bug` - исправление багов
- `enhancement` - новые функции

### Сколько времени займет ревью PR?

- Простые PR: 1-2 дня
- Средние PR: 3-5 дней
- Сложные PR: 1-2 недели

### Могу ли я работать над несколькими Issues?

Да, но:

- Начните с одного
- Завершите начатое прежде чем брать новое
- Коммуницируйте о прогрессе

### Нужно ли мне знать TypeScript?

Желательно, но не обязательно. Вы можете:

- Начать с JavaScript
- Изучать TypeScript по ходу
- Просить помощи в code review

---

<div align="center">

## 🎉 Спасибо за ваш вклад!

Каждый PR, Issue, и комментарий делает MusicVerse AI лучше.

[![Contributors](https://img.shields.io/github/contributors/HOW2AI-AGENCY/aimusicverse?style=for-the-badge)](https://github.com/HOW2AI-AGENCY/aimusicverse/graphs/contributors)

---

**Готовы начать? Создайте ваш первый PR!**

[🏠 Главная](README.md) • [📖 Документация](docs/INDEX.md) • [💬 Discussions](https://github.com/HOW2AI-AGENCY/aimusicverse/discussions)

---

Made with ❤️ by the MusicVerse AI Community

</div>
