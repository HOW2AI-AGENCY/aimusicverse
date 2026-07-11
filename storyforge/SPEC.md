# StoryForge AI — Spec

## Название

**StoryForge AI** — инструмент для создания постоянных персонажей, сценариев, раскадровки и генерации изображений/видео.

## Страницы

### 1. Characters (`/`)

Список созданных персонажей. У каждого: имя, аватар, описание, ID для переиспользования.
Кнопка "New Character" → страница создания.

### 2. Character Creator (`/character/new`)

- Поле: Имя персонажа
- Поле: Описание (возраст, внешность, стиль, особенности)
- Стиль: выбор из пресетов (photo-realistic, anime, cartoon, cinematic)
- Кнопка "Generate" → запрос к Higgsfield Soul V2 / Nano Banana 2 / GPT Image 2
- Результат: 1-4 изображения персонажа
- Кнопка "Save as Avatar" → сохраняет через `higgsfield marketing-studio avatars create` для консистентности в будущих генерациях

### 3. Scene Writer (`/script/new`)

- Текстовый редактор с шаблоном: `INT./EXT. LOCATION - TIME.`
- Персонажи: автоподстановка из созданных
- Сцены разделяются двойным переносом строки
- Кнопка "Generate Storyboard" → переход на страницу раскадровки

### 4. Storyboard (`/storyboard/:id`)

- Список сцен с заголовками
- У каждой сцены: описание, персонажи в сцене, кнопка "Generate Frame"
- Фреймы отображаются как сетка изображений
- Каждый фрейм можно перегенерировать или заменить
- Кнопка "Animate Scene" на любых 2 соседних фреймах → видео через Seedance 2.0

### 5. Export (`/export/:id`)

- Скачать все фреймы как ZIP
- Скачать склеенное видео (если есть анимированные сцены)

## Модели Higgsfield

| Задача                          | Модель                         | CLI                                                                         |
| ------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| Генерация персонажа             | Soul V2 / GPT Image 2          | `higgsfield generate create text2image_soul_v2`                             |
| Сохранение аватара              | Marketing Studio               | `higgsfield marketing-studio avatars create`                                |
| Фрейм сцены (без персонажа)     | GPT Image 2                    | `higgsfield generate create gpt_image_2`                                    |
| Фрейм сцены (с персонажем)      | Soul V2 с `--image-references` | `higgsfield generate create text2image_soul_v2`                             |
| Анимация сцены (изобр. → видео) | Seedance 2.0                   | `higgsfield generate create seedance_2_0 --start-image ... --end-image ...` |

## Технический стек (Higgsfield App Builder)

- Frontend: React (через App Builder)
- Backend: Встроенный (через App Builder API)
- DB: Встроенная (персонажи, сцены, ссылки на генерации)
- Higgsfield API: через встроенную интеграцию Supercomputer

## MVP Scope

✅ Character Creator (текст → изображение)
✅ Scene Writer (написание сценария)
✅ Storyboard Generator (сцена → ключевой кадр)
✅ Save/Load персонажей
⏳ Scene Animator (кадр → видео)
⏳ Export

## Не-MVP

- Консистентность через Soul ID в каждой сцене (требует доработки `custom_reference_id`)
- Генерация голоса/озвучки (Seed Audio 1.0)
- Коллаборация
