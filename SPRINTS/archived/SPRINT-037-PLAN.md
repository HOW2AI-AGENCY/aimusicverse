# Спринт 037: Infrastructure Hardening & Developer Experience (Q3 2026)

**Длительность:** 10 дней
**Цель:** Устранить технический долг инфраструктуры, внедрить автоматизацию качества и улучшить Developer Experience

---

## Задачи

| ID                                               | Название                                                        | Статус      | Исполнитель | SP  |
| ------------------------------------------------ | --------------------------------------------------------------- | ----------- | ----------- | --- |
| **Фаза 1: Quick Wins (День 1-2)**                |
| 037-01                                           | Удаление устаревших конфигов (babel.config.js, jest.config.cjs) | ✅ COMPLETE | Claude      | 1   |
| 037-02                                           | Добавление `graphify update .` в pre-commit hook                | ✅ COMPLETE | Claude      | 1   |
| 037-03                                           | Базовые аудио unit-тесты для audio utilities                    | ✅ COMPLETE | Claude      | 3   |
| **Фаза 2: Инструментарий качества (День 3-5)**   |
| 037-04                                           | Bundle audit с rollup-plugin-visualizer                         | ✅ COMPLETE | Claude      | 2   |
| 037-05                                           | Автоматизация `npm run size` в CI (github-actions)              | ✅ COMPLETE | Claude      | 2   |
| 037-06                                           | Storybook coverage для shared/ui компонентов                    | ✅ COMPLETE | Claude      | 5   |
| **Фаза 3: TypeScript & Type Safety (День 5-7)**  |
| 037-07                                           | TypeScript strict mode — анализ и миграция                      | ✅ COMPLETE | Claude      | 5   |
| 037-08                                           | ESLint plugin expansion — расширение кастомных правил           | ✅ COMPLETE | Claude      | 3   |
| **Фаза 4: Мониторинг & Документация (День 7-9)** |
| 037-09                                           | Sentry Performance monitoring — настройка                       | ✅ COMPLETE | Claude      | 3   |
| 037-10                                           | Проверка и верификация ARCHITECTURE_HUB.md                      | ✅ COMPLETE | Claude      | 2   |
| 037-11                                           | Документирование FSM state schema                               | ✅ COMPLETE | Claude      | 2   |
| **Фаза 5: Производительность (День 9-10)**       |
| 037-12                                           | Telegram Mini App cold start оптимизация                        | ✅ COMPLETE | Claude      | 3   |

---

## Quick Wins (Интегрированы в Sprint 036)

Следующие задачи добавлены в **Sprint 036** как дополнительная фаза:

| ID     | Название                                              | Sprint     | Обоснование                                 |
| ------ | ----------------------------------------------------- | ---------- | ------------------------------------------- |
| 036-13 | a11y fixes — axe-report/, lighthouserc.json настройка | Sprint 036 | Естественное расширение Quality & Stability |
| 036-14 | ESLint plugin expansion — новые кастомные правила     | Sprint 036 | Связано с рефакторингом в Phase 9B          |
| 035-12 | Edge Function unit тесты (Vitest для Edge Functions)  | Sprint 035 | Расширение E2E + Platform Export            |
| 035-13 | Studio V2 E2E тесты (Playwright)                      | Sprint 035 | Часть E2E стабилизации                      |

---

## Критерии успеха Sprint 037

- [x] babel.config.js и jest.config.cjs удалены без ошибок сборки
- [x] `graphify update .` выполняется в pre-commit hook (husky)
- [x] Аудио тесты — 21 тест для core audio utilities (AudioElementPool)
- [x] Bundle visualizer — `npm run analyze` доступен и показывает tree-map
- [x] CI pipeline запускает `npm run size` на каждый PR
- [x] Storybook — 6 stories для shared/ui компонентов (LazyImage, EmptyState, GlowButton, LoadingSpinner, NotificationBadge)
- [x] TypeScript strict mode — noUnusedLocals, noUnusedParameters, strictNullChecks включены (tsconfig.strict.json)
- [x] Sentry Performance — tracesSampleRate: 0.1
- [x] ARCHITECTURE_HUB.md — числа верифицированы (1003 компонента, 330 хуков, 246 edge functions, 341 тест)
- [x] FSM state docs — документированы 4 state machines (Modal, Player, Generation, AudioContext)

---

## Зависимости

- **037-01** ← npm run build проходит успешно (verify)
- **037-02** ← graphify установлен и работает
- **037-06** ← Storybook already configured (.storybook/)
- **037-07** ← eslint.config.js уже существует (225 строк)
- **037-09** ← Sentry already configured (check @sentry/react)

---

## Риски и митигации

| Риск                                            | Вероятность | Влияние | Митигация                                     |
| ----------------------------------------------- | ----------- | ------- | --------------------------------------------- |
| Strict TS сломает сборку                        | Высокая     | Высокое | Инкрементальное включение по директориям      |
| Storybook конфликты с Vite 5                    | Средняя     | Среднее | Проверить совместимость @storybook/react-vite |
| Sentry Performance увеличит стоимость           | Низкая      | Среднее | Установить tracesSampleRate: 0.1              |
| Cold start оптимизация может не дать результата | Средняя     | Низкое  | Замерить before/after с Lighthouse            |
