# Workflow Guide — MusicVerse AI

**Практическое руководство по воркфлоу разработки, CI/CD и GitHub conventions.**

---

## 1. GitHub Branch Protection

### Правила

- **main** защищён — прямой push запрещён
- Все изменения через PR (Pull Request)
- Squash-merge только (merge-коммиты отключены в настройках репозитория)
- 3 обязательных status check: `Quality Check`, `Lint / TypeCheck / Unit Tests`, `Playwright E2E`
- Admin может force-merge через `gh pr merge --squash --admin`

### Создание PR

```bash
# Создать ветку
git checkout -b feat/my-feature

# Закоммитить
git add . && git commit -m "feat(scope): description"

# Запушить
git push origin feat/my-feature

# Создать PR
gh pr create --title "feat: description" --body "Summary..." --head feat/my-feature --base main
```

### Слияние PR

```bash
# Squash merge через CLI
gh pr merge <PR_NUMBER> --squash --admin

# Или через GitHub UI (рекомендуется для обычных PR)
```

---

## 2. CI/CD Pipeline

### Workflow файлы

- `.github/workflows/ci.yml` — Quality Check + Build
- `.github/workflows/playwright.yml` — E2E тесты
- `.github/workflows/docs.yml` — MkDocs + GitHub Pages

### Что проверяется

| Check                             | Что делает                           | Когда падает               |
| --------------------------------- | ------------------------------------ | -------------------------- |
| **Quality Check**                 | ESLint + Prettier + tsc + unit tests | Линтер ошибки, типы, тесты |
| **Lint / TypeCheck / Unit Tests** | Аналогично Quality Check             | Дублирующийся workflow     |
| **Playwright E2E**                | E2E тесты (chromium + mobile)        | Сломанные E2E тесты        |
| **Markdown lint**                 | Проверка .md файлов                  | Сломанные ссылки, формат   |
| **Build & Bundle Size**           | Vite build + size-limit              | Превышение 950KB bundle    |

### Известные проблемы CI

- **Pre-existing lint issues**: `@ts-nocheck` в `presets.api.ts`, `lyrics.api.ts`, `batch.api.ts`; `any` в `studio-generation.api.ts`; `require()` в `scripts/accessibility-audit.js`
- **Node.js deprecation warning**: Actions используют Node.js 20, но runner на Node.js 24
- **Coverage upload**: Падает если нет директории `coverage/`

---

## 3. Commit Message Format

### Conventional Commits 1.0

```
<type>(<scope>): <subject>

[body]
[footer]
```

### Правила commitlint

- **Subject**: lowercase required (не `Test:`, а `test:`)
- **Body lines**: max 100 символов
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### Примеры

```
test: add api layer tests for generation, credits, tracks
feat(studio): add stem solo button
fix(player): avoid double-play on ios safari
docs: update sprint 051 status - tests 395 to 899 passing
```

### Husky hooks

- **pre-commit**: ESLint + Prettier + TypeScript check
- **commit-msg**: commitlint validation

---

## 4. Vitest Configuration

### Текущая конфигурация (`vitest.config.ts`)

```typescript
include: [
  "src/**/*.test.{ts,tsx}",
  "tests/unit/**/*.{test,spec}.{ts,tsx}",  // Добавлено в Sprint 051
],
```

### Структура тестов

- `src/__tests__/` — основные тесты (API, hooks, lib, stores, services)
- `tests/unit/` — legacy тесты (25 файлов, теперь тоже исполняются)
- `src/**/__tests__/` — co-located тесты рядом с кодом

### Запуск тестов

```bash
# Все тесты
npm test

# Конкретный файл
npx vitest run src/__tests__/api/credits.api.test.ts

# С coverage
npm run test:coverage
```

### Windows-specific

```powershell
# NODE_OPTIONS не работает в PowerShell напрямую
# Использовать:
$env:NODE_OPTIONS="--max-old-space-size=2048"; node ./node_modules/vitest/vitest.mjs run
```

---

## 5. npmrc и Platform Issues

### Проблема

`~/.npmrc` может содержать `os=linux`, что вызывает установку Linux-биндингов вместо Windows.

### Решение

```powershell
# Проверить
npm config get os

# Исправить
# В ~/.npmrc заменить os=linux на os=win32

# Переустановить зависимости
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

---

## 6. Sprint Workflow

### Структура спринтов

- `SPRINTS/SPRINT-XXX-PLAN.md` — детальный план
- `SPRINTS/SPRINT-PROGRESS.md` — трекер всех спринтов
- `PROJECT_STATUS.md` — общий статус проекта
- `ROADMAP.md` — дорожная карта

### Обновление статусов

1. Обновить `SPRINT-PROGRESS.md` (таблица + метрики)
2. Обновить `PROJECT_STATUS.md` (блоки задач)
3. Обновить `ROADMAP.md` (Planned / In Progress / Completed)
4. Обновить `CHANGELOG.md` (если есть пользовательские изменения)

### Нумерация спринтов

- Сквозная нумерация (050, 051, 052, ...)
- Подзадачи: T051, T052, T053, ...
- Фазы: Phase A, B, C, D

---

## 7. Pre-commit Hooks

### Что проверяется

1. **CSS @import order** — кастомный скрипт
2. **Section design tokens** — ESLint плагин `section-tokens/no-saturated-brand`
3. **Structure graph** — graphify update (может падать если graphify не установлен)
4. **ESLint** — линтинг всех staged файлов
5. **Prettier** — форматирование
6. **TypeScript** — type check
7. **commitlint** — формат коммита

### Пропуск hooks

```bash
# НЕ рекомендуется, но если нужно:
git commit --no-verify
```

---

## 8. Bundle Size

### Лимиты

- **Eager load**: <950 KB gzip
- **Total bundle**: ~2.11 MB (все чанки включая admin/studio)

### Проверка

```bash
npm run size
npm run analyze  # Визуализация бандла
```

---

## 9. Storybook

### Запуск

```bash
npm run storybook
```

### Создание stories

- Паттерн: `src/stories/<component>/<Component>.stories.tsx`
- 6 состояний minimum: Empty, Filled, Loading, Success, Mobile, Desktop

---

## 10. Полезные команды

```bash
# Статус проекта
git status
git log --oneline -10

# Проверка перед коммитом
npm run lint
npm run format:check
npx tsc --noEmit -p tsconfig.app.json
npm test

# GitHub CLI
gh pr list
gh pr view <PR_NUMBER>
gh pr checks <PR_NUMBER>
gh run view <RUN_ID>

# Ветки
git branch -a --sort=-committerdate
git stash && git pull && git stash pop
```

---

_Создано: 2026-07-06_
