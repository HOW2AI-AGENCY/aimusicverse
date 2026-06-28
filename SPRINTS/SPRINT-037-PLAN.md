# Спринт 037: Infrastructure Hardening & Developer Experience (Q3 2026)

**Длительность:** 10 дней
**Цель:** Устранить технический долг инфраструктуры, внедрить автоматизацию качества и улучшить Developer Experience

---

## Задачи

| ID | Название | Статус | Исполнитель | SP |
|----|----------|--------|-------------|-----|
| **Фаза 1: Quick Wins (День 1-2)** |
| 037-01 | Удаление устаревших конфигов (babel.config.js, jest.config.cjs) | 🔴 OPEN | — | 1 |
| 037-02 | Добавление `graphify update .` в pre-commit hook | 🔴 OPEN | — | 1 |
| 037-03 | Базовые аудио unit-тесты для audio utilities | 🔴 OPEN | — | 3 |
| **Фаза 2: Инструментарий качества (День 3-5)** |
| 037-04 | Bundle audit с rollup-plugin-visualizer | 🔴 OPEN | — | 2 |
| 037-05 | Автоматизация `npm run size` в CI (github-actions) | 🔴 OPEN | — | 2 |
| 037-06 | Storybook coverage для shared/ui компонентов | 🔴 OPEN | — | 5 |
| **Фаза 3: TypeScript & Type Safety (День 5-7)** |
| 037-07 | TypeScript strict mode — анализ и миграция | 🔴 OPEN | — | 5 |
| 037-08 | ESLint plugin expansion — расширение кастомных правил | 🔴 OPEN | — | 3 |
| **Фаза 4: Мониторинг & Документация (День 7-9)** |
| 037-09 | Sentry Performance monitoring — настройка | 🔴 OPEN | — | 3 |
| 037-10 | Проверка и верификация ARCHITECTURE_HUB.md | 🔴 OPEN | — | 2 |
| 037-11 | Документирование FSM state schema | 🔴 OPEN | — | 2 |
| **Фаза 5: Производительность (День 9-10)** |
| 037-12 | Telegram Mini App cold start оптимизация | 🔴 OPEN | — | 3 |

---

## Quick Wins (Интегрированы в Sprint 036)

Следующие задачи добавлены в **Sprint 036** как дополнительная фаза:

| ID | Название | Sprint | Обоснование |
|----|----------|--------|-------------|
| 036-13 | a11y fixes — axe-report/, lighthouserc.json настройка | Sprint 036 | Естественное расширение Quality & Stability |
| 036-14 | ESLint plugin expansion — новые кастомные правила | Sprint 036 | Связано с рефакторингом в Phase 9B |
| 035-12 | Edge Function unit тесты (Vitest для Edge Functions) | Sprint 035 | Расширение E2E + Platform Export |
| 035-13 | Studio V2 E2E тесты (Playwright) | Sprint 035 | Часть E2E стабилизации |

---

## Критерии успеха Sprint 037

- [ ] babel.config.js и jest.config.cjs удалены без ошибок сборки
- [ ] `graphify update .` выполняется в pre-commit hook (husky)
- [ ] Аудио тесты — минимум 5 тестов для core audio utilities
- [ ] Bundle visualizer — `npm run analyze` доступен и показывает tree-map
- [ ] CI pipeline запускает `npm run size` на каждый PR
- [ ] Storybook — минимум 5 stories для shared/ui компонентов
- [ ] TypeScript strict mode — noUnusedLocals, noUnusedParameters, strictNullChecks включены
- [ ] Sentry Performance — транзакции и traces sample rate >0
- [ ] ARCHITECTURE_HUB.md — все разделы верифицированы с кодом
- [ ] FSM state docs — документированы все state machines проекта

---

## Зависимости

- **037-01** ← npm run build проходит успешно (verify)
- **037-02** ← graphify установлен и работает
- **037-06** ← Storybook already configured (.storybook/)
- **037-07** ← eslint.config.js уже существует (225 строк)
- **037-09** ← Sentry already configured (check @sentry/react)

---

## Риски и митигации

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Strict TS сломает сборку | Высокая | Высокое | Инкрементальное включение по директориям |
| Storybook конфликты с Vite 5 | Средняя | Среднее | Проверить совместимость @storybook/react-vite |
| Sentry Performance увеличит стоимость | Низкая | Среднее | Установить tracesSampleRate: 0.1 |
| Cold start оптимизация может не дать результата | Средняя | Низкое | Замерить before/after с Lighthouse |
