# Repository Audit & Improvement Workflow

**Мета-информация:**

export const meta = {
name: 'repository-audit',
description: 'Full repository architecture audit and documentation restructuring with Git-based sprint tracking',
phases: [
{ title: 'Analysis', detail: 'Scan repository structure and identify issues' },
{ title: 'Planning', detail: 'Design target structure and improvements' },
{ title: 'Implementation', detail: 'Restructure and update documentation' },
{ title: 'Verification', detail: 'Verify improvements and generate final report' }
]
}

**Запуск:**

```bash
# Запуск агента для аудита
npx claude-code-workflow repository-audit
```

---

## Рабочий процесс агента

### Фаза 1: Анализ (Diagnosis)

**Цель:** Провести полное сканирование репозитория и выявить проблемные зоны.

**Шаги:**

1. **Сканирование файловой структуры:**
   - Проанализировать иерархию директорий
   - Выявить дублирование файлов и кода
   - Найти неиспользуемые файлы
   - Проверить корректность `.gitignore`

2. **Аудит документации:**
   - Проверить наличие `README.md` в корне и ключевых директориях
   - Проверить связанность документации (наличие перекрестных ссылок)
   - Оценить полноту описания архитектуры
   - Проверить актуальность ссылок

3. **Анализ навигации:**
   - Проверить наличие `DOCUMENTATION_INDEX.md` или аналога
   - Оценить связность системы документации
   - Проверить доступность ключевой информации для новичков

4. **Аудит системы трекинга:**
   - Проверить наличие директории `/sprints` или аналога
   - Оценить качество задач в спринтах
   - Проверить наличие Дашборда прогресса
   - Анализировать соответствие Git-flow и конвенции коммитов

5. **Проверка контрибьютинга:**
   - Проверить наличие `CONTRIBUTING.md`
   - Проверить наличие `.github/` шаблонов
   - Оценить понятность инструкций для контрибьюторов

**Результаты фазы:**

- Отчет: "Текущее состояние → Проблемные зоны → Предлагаемая целевая структура"
- Список конкретных проблем с приоритетами

---

### Фаза 2: Планирование (Planning)

**Цель:** Разработать план реструктуризации и улучшений.

**Шаги:**

1. **Разработка целевой структуры:**
   - Спроектировать стандартизированную структуру каталогов
   - Определить необходимый набор документации
   - Спроектировать систему навигации

2. **Планирование документации:**
   - Определить список README.md для создания/обновления
   - Спланировать систему перекрестных ссылок
   - Разработать шаблоны для локальных README

3. **Планирование системы трекинга:**
   - Разработать шаблон для файлов спринтов
   - Спроектировать структуру Дашборда прогресса
   - Определить метрики для отслеживания

4. **Планирование контрибьютинга:**
   - Разработать структуру `CONTRIBUTING.md`
   - Спланировать `.github/` шаблоны
   - Определить правила Git-flow и конвенцию коммитов

**Результаты фазы:**

- Детальный план реструктуризации
- Шаблоны документов
- Порядок внедрения изменений

---

### Фаза 3: Внедрение (Implementation)

**Цель:** Реализовать изменения поэтапно.

**Шаги:**

1. **Создание/обновление базовой документации:**
   - Обновить главный `README.md`
   - Создать `DOCUMENTATION_INDEX.md`
   - Создать `CONTRIBUTING.md`
   - Создать `.github/` шаблоны

2. **Создание локальных README:**
   - Создать README.md в ключевых директориях
   - Добавить перекрестные ссылки
   - Стандартизировать формат

3. **Развертывание системы трекинга:**
   - Создать директорию `/sprints`
   - Создать файлы спринтов по шаблону
   - Создать Дашборд прогресса
   - Настроить автоматические обновления

4. **Обновление `.gitignore`:**
   - Добавить игнорируемые файлы под технологический стек
   - Убрать лишние исключения

5. **Создание навигации:**
   - Связать все markdown-файлы перекрестными ссылками
   - Создать меню в `DOCUMENTATION_INDEX.md`
   - Добавить breadcrumbs где необходимо

**Результаты фазы:**

- Обновленная структура репозитория
- Полный комплект документации
- Работающая система трекинга

---

### Фаза 4: Верификация (Verification)

**Цель:** Проверить качество внедренных изменений.

**Шаги:**

1. **Проверка документации:**
   - Верифицировать наличие всех необходимых файлов
   - Проверить работоспособность всех ссылок
   - Убедиться в понятности для новичков

2. **Проверка навигации:**
   - Пройти по всем ключевым путям
   - Убедиться в отсутствии битых ссылок
   - Проверить доступность информации

3. **Проверка системы трекинга:**
   - Верифицировать работоспособность Дашборда
   - Проверить полноту информации в спринтах
   - Убедиться в актуальности статусов

4. **Финальная проверка CI/CD:**
   - Убедиться что сборка не сломалась
   - Проверить что тесты проходят
   - Верифицировать что деплой работает

**Результаты фазы:**

- Итоговый отчет с картой репозитория
- Инструкция по поддержанию порядка
- Список оставшихся улучшений (опционально)

---

## Шаблоны

### Шаблон README.md (корневой)

````markdown
# Project Name

Краткое описание проекта (1-2 предложения).

## 🚀 Quick Start

### Setup

```bash
git clone https://github.com/owner/repo.git
cd repo
npm install
npm run dev
```
````

### Launch

```bash
npm run dev
# Откроется http://localhost:3000
```

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System architecture
- [API Reference](docs/API.md) - API documentation
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🏗 Tech Stack

- **Frontend:** React 19, TypeScript 5, Vite 5
- **Backend:** Node.js, Express
- **Database:** PostgreSQL

## 📊 Status

- ✅ Production ready
- 🔄 Active development

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT

````

### Шаблон README.md (локальный)

```markdown
# Folder Name

## Назначение

Краткое описание назначения этой директории.

## Взаимосвязи

- Используется: `[Parent Component]`
- Зависит от: `[Dependency]`
- Использует: `[Used Library]`

## Структура

````

folder/
├── subfolder1/ # Описание
├── subfolder2/ # Описание
└── index.ts # Точка входа

```

## Правила добавления новых файлов

1. Правило 1
2. Правило 2

## Связанные разделы

- [Родительский компонент](../parent/README.md)
- [Документация](../../docs/ARCHITECTURE.md)
```

### Шаблон файла спринта

```markdown
# Sprint 01: Sprint Name

**Дата:** YYYY-MM-DD  
**Ответственный:** @username  
**Статус:** 🔄 В работе | ✅ Готово | ⏳ Планируется

## Цели

- Цель 1
- Цель 2

## Задачи

| ID   | Описание         | Исполнитель | Дедлайн    | Статус      |
| ---- | ---------------- | ----------- | ---------- | ----------- |
| T001 | Task description | @user       | YYYY-MM-DD | 🔄 В работе |
| T002 | Another task     | @user2      | YYYY-MM-DD | ✅ Готово   |

## Прогресс

- Завершено: X/Y задач
- В работе: Z задач
- Блокеры: [список блокеров]

## Ретроспектива (после завершения)

- Что пошло хорошо
- Что можно улучшить
- Action items
```

---

## Выполнение сценария

```javascript
export async function run() {
  // Фаза 1: Анализ
  const analysis = await phase("Analysis", async () => {
    const structure = await analyzeStructure();
    const docs = await auditDocumentation();
    const tracking = await auditTracking();
    const contributing = await auditContributing();

    return {
      structure,
      docs,
      tracking,
      contributing,
      problems: identifyProblems(structure, docs, tracking, contributing),
    };
  });

  // Фаза 2: Планирование
  const plan = await phase("Planning", async () => {
    return {
      targetStructure: designTargetStructure(analysis.structure),
      docsPlan: planDocumentation(analysis.docs),
      trackingPlan: planTracking(analysis.tracking),
      contributingPlan: planContributing(analysis.contributing),
      implementationOrder: determineOrder(analysis.problems),
    };
  });

  // Фаза 3: Внедрение
  const implementation = await phase("Implementation", async () => {
    return {
      docs: await implementDocs(plan.docsPlan),
      tracking: await implementTracking(plan.trackingPlan),
      contributing: await implementContributing(plan.contributingPlan),
      structure: await restructure(plan.targetStructure),
    };
  });

  // Фаза 4: Верификация
  const verification = await phase("Verification", async () => {
    return {
      docs: await verifyDocs(implementation.docs),
      tracking: await verifyTracking(implementation.tracking),
      ci: await verifyCI(),
      finalReport: generateFinalReport(analysis, plan, implementation),
    };
  });

  return {
    success: true,
    analysis: analysis.problems,
    improvements: verification.finalReport,
    nextSteps: verification.finalReport.nextSteps,
  };
}
```

---

## Результаты

После выполнения сценария вы получите:

1. **Отчет аудита:** `repository-audit-report.md`
2. **Обновленная документация:** Все README.md обновлены
3. **Система трекинга:** Директория `/sprints` с файлами спринтов
4. **Навигация:** Полностью связанная система документации
5. **Инструкция:** Руководство по поддержанию порядка

---

## Поддержка

Для вопросов и улучшений создайте issue или PR.
