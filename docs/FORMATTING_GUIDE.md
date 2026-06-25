# 💅 Руководство по форматированию MusicVerse AI

**Последнее обновление:** 25 июня 2026  
**Версия:** 1.0.0 | **Статус:** ✅ Production Ready

---

## 📋 Содержание

- [🎯 Общие принципы](#-общие-принципы)
- [💻 Код (TypeScript/TSX)](#-код-typescripttsx)
- [📝 Markdown документы](#-markdown-документы)
- [🎨 CSS/Styles](#-cssstyles)
- [📊 JSON конфигурации](#-json-конфигурации)
- [🔧 YAML/TOML](#-yamltoml)
- [📱 Мобильное форматирование](#-мобильное-форматирование)
- [✅ Чеклисты](#-чеклисты)

---

## 🎯 Общие принципы

### Консистентность

✅ **Всегда:**
- Следуйте установленным правилам форматирования
- Используйте инструменты автоматического форматирования (Prettier)
- Проверяйте код перед коммитом
- Соблюдайте структуру проекта

❌ **Никогда:**
- Не форматируйте код вручную, если есть автоматические инструменты
- Не смешивайте стили форматирования
- Не игнорируйте ошибки линтера

### Инструменты

| Инструмент | Назначение | Команда |
|-----------|-----------|---------|
| **Prettier** | Форматирование кода | `npm run format` |
| **ESLint** | Линтинг | `npm run lint` |
| **TypeScript** | Проверка типов | `npm run typecheck` |
| **EditorConfig** | Базовое форматирование | Автоматически |

---

## 💻 Код (TypeScript/TSX)

### Настройки Prettier

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 120,
  "tabWidth": 2
}
```

### Правила форматирования

#### Отступы и пробелы

```typescript
// ✅ Правильно: 2 пробела, trailing comma
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com',
};

// ❌ Неправильно: смешанные отступы, нет trailing comma
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
}
```

#### Длина строки

```typescript
// ✅ Правильно: перенос длинных строк
const result = await generateTrack(
  'Upbeat electronic dance music with synthesizers',
  {
    duration: 180,
    instrumental: false,
    style: 'electronic',
  }
);

// ❌ Неправильно: слишком длинная строка
const result = await generateTrack('Upbeat electronic dance music with synthesizers', { duration: 180, instrumental: false, style: 'electronic' });
```

#### Импорты

```typescript
// ✅ Правильно: сгруппированные импорты
// 1. Внешние библиотеки
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Внутренние абсолютные импорты
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';

// 3. Относительные импорты
import { formatDuration } from './utils';
import type { Track } from './types';

// ❌ Неправильно: смешанные импорты
import { useState } from 'react';
import { formatDuration } from './utils';
import { Button } from '@/components/ui/button';
```

#### Объекты и массивы

```typescript
// ✅ Правильно: trailing comma, aligned
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  features: {
    cache: true,
    logging: false,
  },
};

const items = [
  'item1',
  'item2',
  'item3',
];

// ❌ Неправильно: нет trailing comma
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
}
```

#### Функции

```typescript
// ✅ Правильно: отступы, пробелы
function calculateTotal(
  price: number,
  tax: number,
  discount: number
): number {
  const subtotal = price + tax;
  return subtotal - discount;
}

// ❌ Неправильно: сжатый стиль
function calculateTotal(price: number, tax: number, discount: number): number {
  const subtotal = price + tax;
  return subtotal - discount;
}
```

#### Условные выражения

```typescript
// ✅ Правильно: пробелы вокруг операторов
if (isPlaying && duration > 0 && !isLoading) {
  handlePlay();
}

// ❌ Неправильно: нет пробелов
if(isPlaying&&duration>0&&!isLoading) {
  handlePlay();
}
```

---

## 📝 Markdown документы

### Настройки Prettier

```json
{
  "markdown": {
    "printWidth": 120,
    "proseWrap": "preserve",
    "enableExperimentalTrickyMarkdown": true
  }
}
```

### Структура документа

```markdown
# Заголовок первого уровня (только один на документ)

Краткое описание документа.

## Заголовок второго уровня

Содержание раздела.

### Заголовок третьего уровня

Подраздел.

#### Заголовок четвертого уровня

Детали.

##### Заголовок пятого уровня

Очень детали.

###### Заголовок шестого уровня

Максимальная детализация.

---

Разделитель для визуального отделения секций.

## Списки

### Неупорядоченный список

- Элемент 1
- Элемент 2
  - Вложенный элемент
  - Еще вложенный
- Элемент 3

### Упорядоченный список

1. Первый шаг
2. Второй шаг
3. Третий шаг

### Чеклист

- [x] Выполненная задача
- [ ] Невыполненная задача
- [ ] Еще одна задача

## Таблицы

| Колонка 1 | Колонка 2 | Колонка 3 |
|-----------|-----------|-----------|
| Значение 1 | Значение 2 | Значение 3 |
| Значение 4 | Значение 5 | Значение 6 |

## Код

Inline `код` в тексте.

Блок кода с языком:

```typescript
const greeting: string = 'Hello, World!';
console.log(greeting);
```

## Ссылки

[Текст ссылки](https://example.com)

[Ссылка с заголовком](https://example.com "Заголовок")

## Выделение

**Жирный текст**  
*Курсивный текст*  
***Жирный курсив***  
~~Зачеркнутый текст~~

## Цитаты

> Это цитата.
> Может быть многострочной.

> **Важное примечание:** Обратите внимание на это.

## Эмодзи

Используйте эмодзи для визуального улучшения:

- ✅ Выполнено
- ❌ Не выполнено
- ⚠️ Предупреждение
- 💡 Совет
- 🎯 Цель
- 🚀 Запуск
- 📝 Документация
- 🐛 Баг
- ✨ Новое
- 🔥 Горячее
```

### Правила Markdown

#### Заголовки

```markdown
# H1 - Только один на документ, главный заголовок

## H2 - Основные разделы

### H3 - Подразделы

#### H4 - Детали

##### H5 - Редко используется

###### H6 - Максимальная детализация
```

#### Пробелы

```markdown
# ✅ Правильно: пустая строка перед и после заголовков

## Заголовок

Текст параграфа.

## ❌ Неправильно: нет пробелов

## Заголовок
Текст параграфа.
```

#### Списки

```markdown
# ✅ Правильно: пустая строка перед списком

Текст перед списком.

- Элемент 1
- Элемент 2

# ❌ Неправильно: нет пустой строки

Текст перед списком.
- Элемент 1
- Элемент 2
```

#### Таблицы

```markdown
# ✅ Правильно: выровненные колонки

| Правый | Центр | Левый |
|--------|:-----:|-------|
| Текст  | Текст | Текст |
| Текст  | Текст | Текст |

# ❌ Неправильно: невыровненные колонки

| Правый|Центр|Левый|
|-------|-----|-----|
| Текст | Текст | Текст |
```

---

## 🎨 CSS/Styles

### Tailwind классы

```tsx
// ✅ Правильно: логическая группировка классов
<div className="
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 m-2 gap-4
  // Typography
  text-lg font-semibold text-gray-900
  // Colors
  bg-white rounded-lg shadow-md
  // Responsive
  md:p-6 lg:p-8
  // States
  hover:bg-gray-50 focus:outline-none
">

// ❌ Неправильно: хаотичный порядок
<div className="shadow-md p-4 text-lg hover:bg-gray-50 flex items-center rounded-lg font-semibold">
```

### CSS модули

```css
/* ✅ Правильно: логическая группировка */
.container {
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Spacing */
  padding: 1rem;
  margin: 0.5rem;
  gap: 1rem;
  
  /* Typography */
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  
  /* Background */
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ❌ Неправильно: хаотичный порядок */
.container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 1.125rem;
  padding: 1rem;
  color: #111827;
  display: flex;
}
```

---

## 📊 JSON конфигурации

### Форматирование

```json
{
  "name": "musicverse",
  "version": "1.0.0",
  "description": "AI Music Platform",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^5.0.0"
  }
}
```

### Правила

- Отступ: 2 пробела
- Trailing comma: да
- Кавычки: двойные
- Сортировка: алфавитная (опционально)

---

## 🔧 YAML/TOML

### YAML

```yaml
# ✅ Правильно: 2 пробела отступа
name: musicverse
version: 1.0.0

database:
  host: localhost
  port: 5432
  name: musicverse_db

features:
  - generation
  - player
  - library
  - studio

# ❌ Неправильно: смешанные отступы
name: musicverse
version: 1.0.0
database:
host: localhost
port: 5432
```

### TOML

```toml
# ✅ Правильно: 2 пробела отступа
[package]
name = "musicverse"
version = "1.0.0"

[database]
host = "localhost"
port = 5432

# ❌ Неправильно: табы или 4 пробела
[package]
name = "musicverse"
	version = "1.0.0"
```

---

## 📱 Мобильное форматирование

### Touch targets

```tsx
// ✅ Правильно: минимум 44×44px
<button className="min-w-[44px] min-h-[44px] p-2">
  <Icon />
</button>

// ❌ Неправильно: слишком маленький
<button className="p-1">
  <Icon />
</button>
```

### Responsive классы

```tsx
// ✅ Правильно: mobile-first подход
<div className="
  p-4           // mobile: 16px
  md:p-6        // tablet: 24px
  lg:p-8        // desktop: 32px
  text-base     // mobile: 16px
  md:text-lg    // tablet: 18px
  lg:text-xl    // desktop: 20px
">

// ❌ Неправильно: desktop-first
<div className="
  lg:p-8
  md:p-6
  p-4
">
```

---

## ✅ Чеклисты

### Перед коммитом

- [ ] Код отформатирован (`npm run format`)
- [ ] Нет ошибок линтинга (`npm run lint`)
- [ ] TypeScript проверки пройдены (`npm run typecheck`)
- [ ] Тесты проходят (`npm test`)
- [ ] Markdown файлы отформатированы

### Code Review чеклист

- [ ] Форматирование соответствует стандартам
- [ ] Нет лишних пробелов/пустых строк
- [ ] Имена переменных понятные
- [ ] Код отформатирован автоматически
- [ ] Markdown документы отформатированы

### Документация чеклист

- [ ] Заголовки структурированы (H1-H6)
- [ ] Таблицы выровнены
- [ ] Код имеет языковые теги
- [ ] Ссылки работают
- [ ] Эмодзи используются последовательно
- [ ] Чеклисты отформатированы

---

## 🎯 Примеры форматирования

### Компонент React

```tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { formatDuration } from './utils';
import type { Track } from './types';
import './styles.css';

interface TrackCardProps {
  track: Track;
  onPlay: (id: string) => void;
  className?: string;
}

export const TrackCard = ({
  track,
  onPlay,
  className = '',
}: TrackCardProps) => {
  const { user } = useTelegram();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    console.log('Track mounted:', track.id);
  }, [track.id]);

  const handleClick = () => {
    onPlay(track.id);
    setIsPlaying(true);
  };

  return (
    <div className={`p-4 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold">{track.title}</h3>
      <p className="text-sm text-gray-600">{track.artist}</p>
      <Button onClick={handleClick}>Play</Button>
    </div>
  );
};
```

### Хук

```tsx
import { useState, useEffect, useCallback } from 'react';

interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  loop?: boolean;
}

export const useAudioPlayer = (
  audioUrl: string,
  options: UseAudioPlayerOptions = {}
) => {
  const { autoPlay = false, loop = false } = options;
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    // Effect logic
  }, [audioUrl]);

  return {
    isPlaying,
    duration,
    currentTime,
    togglePlay,
  };
};
```

### Сервис

```typescript
import { supabase } from '@/api/supabase';
import type { Track, GenerationOptions } from '@/types';

export const generationService = {
  async generateTrack(
    prompt: string,
    options: GenerationOptions
  ): Promise<Track> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate',
        {
          body: { prompt, options },
        }
      );

      if (error) {
        throw new Error(`Generation failed: ${error.message}`);
      }

      return data as Track;
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  },

  async getTrack(id: string): Promise<Track> {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch track: ${error.message}`);
    }

    return data as Track;
  },
};
```

---

## 🎓 Обучение форматированию

### Ресурсы

- **[Prettier Docs](https://prettier.io/docs/en/)** — Официальная документация
- **[ESLint Docs](https://eslint.org/docs/latest/)** — Линтинг
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)** — Типы
- **[EditorConfig](https://editorconfig.org/)** — Базовое форматирование

### Практика

1. Включите автоматическое форматирование в IDE
2. Настройте pre-commit hooks (husky)
3. Используйте ESLint плагины для IDE
4. Следите за warnings в консоли

---

## 🔗 Связанные документы

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — Стиль кода
- **[REPOSITORY_STRUCTURE.md](../REPOSITORY_STRUCTURE.md)** — Структура проекта
- **[.prettierrc.json](../.prettierrc.json)** — Prettier конфигурация
- **[eslint.config.js](../eslint.config.js)** — ESLint конфигурация
- **[.editorconfig](../.editorconfig)** — EditorConfig

---

<div align="center">

**Форматирование — это забота каждого!** 💅

*Последнее обновление: 25 июня 2026*

[🔝 В начало](#-руководство-по-форматированию-musicverse-ai)

</div>