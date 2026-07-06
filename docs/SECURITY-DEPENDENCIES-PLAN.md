# План обновления зависимостей для исправления уязвимостей

**Дата:** 2026-07-06
**Статус:** 🔄 Требует планирования

## 📊 Текущее состояние

### Обнаруженные уязвимости (6 total)

```
npm audit report:

esbuild <=0.24.2 || 0.27.3 - 0.28.0
Severity: moderate
- GHSA-67mh-4wv8-2f99: Development server SSRF
- GHSA-g7r4-m6w7-qqqr: Arbitrary file read on Windows
Current version: 0.27.7 (vulnerable)

uuid < 11.1.1
Severity: moderate
- GHSA-w5hq-g745-h8pq: Missing buffer bounds check
Current version: 9.0.1 (vulnerable)
```

### Затронутые пакеты

**Проблема 1: esbuild**

- Используется через: `vite@5.4.21`, `@vitest/mocker@4.1.9`
- Текущая версия: `0.27.7` (vulnerable)
- Безопасная версия: `>=0.28.0`
- Проблема: Требует **Vite 8.x** (breaking change)

**Проблема 2: uuid**

- Используется через: `@storybook/addon-actions@8.6.14`
- Текущая версия: `9.0.1` (vulnerable)
- Безопасная версия: `>=11.1.1`
- Проблема: Требует **Storybook 10.x** (breaking change)

## 🎯 Стратегия обновления

### Вариант A: Постепенное обновление (рекомендуется)

#### Phase 1: Storybook 8.x → 10.x (1-2 дня)

- **Риски:** Breaking changes в Storybook API, component changes
- **Польза:** Исправление uuid уязвимости
- **План:**
  1. Создать ветку `security/storybook-10-upgrade`
  2. Обновить Storybook до последней версии 10.x
  3. Протестировать все Storybook stories (6 → ?)
  4. Обновить документацию, если API изменился
  5. PR в main + code review

#### Phase 2: Vite 5.x → 8.x (2-3 дня)

- **Риски:** Breaking changes в Vite config, plugin ecosystem
- **Польза:** Исправление esbuild уязвимости + performance improvements
- **План:**
  1. Создать ветку `security/vite-8-upgrade`
  2. Обновить Vite до последней версии 8.x
  3. Обновить все Vite-плагины до совместимых версий
  4. Протестировать dev server, build, preview
  5. Протестировать all E2E scenarios
  6. Проверить bundle size (может измениться)
  7. PR в main + code review

### Вариант B: Комплексное обновление (рискованно)

- Обновить все major версии одновременно
- **Риски:** Высокая вероятность поломки, сложно отладить
- **Польза:** Все исправления за один раз
- **Не рекомендуется** без выделенного спринта

### Вариант C: Подождать (текущий подход)

- **Риски:** Уязвимости остаются открытыми
- **Польза:** Стабильность проекта
- **Митигация:**
  - Эти уязвимости относятся к development dependencies
  - Не влияют на production билд
  - Development server не эксплуатируется в production

## 📋 План действий (Sprint 058+)

### Sprint 058: Storybook Upgrade (приоритет: LOW)

- **Цель:** Исправить uuid уязвимость
- **Продолжительность:** 1-2 дня
- **KPI:**
  - Storybook 10.x установлена
  - Все stories работают
  - 0 уязвимостей uuid

### Sprint 059: Vite Upgrade (приоритет: LOW)

- **Цель:** Исправить esbuild уязвимость
- **Продолжительность:** 2-3 дня
- **KPI:**
  - Vite 8.x установлена
  - Dev/build/preview работают
  - E2E tests pass
  - Bundle size в пределах бюджета
  - 0 уязвимостей esbuild

## 🔍 Текущий анализ воздействия

### Development Environment (затронуто)

- ✅ Vulnerable esbuild в dev server (не production)
- ✅ Vulnerable uuid в Storybook (не production)
- ✅ Vite 5.x использует уязвимый esbuild

### Production Build (не затронуто)

- ✅ Production build не использует уязвимый dev server
- ✅ Storybook не деплоится в production
- ✅ Уязвимости не эксплойтятся в runtime

## 💡 Рекомендации

### Краткосрочно (текущий спринт)

1. ✅ Задокументировать уязвимости (этот файл)
2. ✅ Добавить предупреждение в README (сделано)
3. ✅ Обновить PROJECT_STATUS.md с флагом vulnerabilities (сделано)

### Среднесрочно (Sprint 058-059)

1. 🔄 Планировать Storybook upgrade (Sprint 058)
2. 🔄 Планировать Vite upgrade (Sprint 059)
3. 🔄 Выделить отдельный спринт для security обновлений

### Долгосрочно

1. 🔄 Настроить Dependabot для автоматических PR
2. 🔄 Добавить security audit в CI pipeline
3. 🔄 Планировать регулярные обновления зависимостей (квартально)

## 📊 Метрики

| Метрика          | Сейчас                        | После обновления   | Цель   |
| ---------------- | ----------------------------- | ------------------ | ------ |
| Vulnerabilities  | 6 (1 high, 4 moderate, 1 low) | 0                  | ✅ 0   |
| Storybook        | 8.x                           | 10.x               | Latest |
| Vite             | 5.x                           | 8.x                | Latest |
| Breaking changes | 0                             | 2-4 минимизировать | <5     |

## 🎯 Заключение

Текущие уязвимости **критичны для development окружения**, но **не влияют на production**.

**Рекомендуемый подход:**

- Постепенное обновление в двух отдельных спринтах
- Тщательное тестирование после каждого major upgrade
- Выделение спринтов 058-059 для security работы

**Альтернатива:**

- Подождать, пока ecosystem стабилизируется
- Следить за security advisories
- Обновиться, когда выйдет стабильная Vite 8.x и Storybook 10.x

---

**Последнее обновление:** 2026-07-06
**Ответственный:** Team Lead
**Следующий обзор:** После Sprint 057 completion
