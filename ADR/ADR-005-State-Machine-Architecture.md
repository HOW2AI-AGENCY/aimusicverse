# ADR-005: Архитектура State Machine

- **Статус:** Принято
- **Дата:** 2025-12-19

## Контекст

Сложные UI flows (Lyrics Wizard, Generation) управлялись через loose state с множеством boolean флагов и step counters. Это приводило к:
- Невалидным состояниям (например, `isLoading: true` + `isSuccess: true`)
- Сложности в понимании возможных переходов
- Багам при добавлении новых состояний

## Решение

### Легковесный State Machine на TypeScript

Вместо тяжёлого XState используем собственную реализацию на discriminated unions:

```typescript
// Конфигурация
const machineConfig: StateConfig<State, Context> = {
  initial: 'idle',
  context: { progress: 0 },
  states: {
    idle: {
      on: { START: 'loading' },
      entry: (ctx) => { ctx.progress = 0; }
    },
    loading: {
      on: { 
        SUCCESS: 'success',
        ERROR: 'error'
      }
    },
    success: { on: { RESET: 'idle' } },
    error: { on: { RETRY: 'loading', RESET: 'idle' } }
  }
};

// React hook
const { state, context, send, can } = useStateMachine(machineConfig);
```

### Преимущества нашей реализации vs XState

| Аспект | Наша реализация | XState |
|--------|-----------------|--------|
| Размер бандла | ~2KB | ~40KB |
| Типобезопасность | Полная | Требует codegen |
| Кривая обучения | Низкая | Высокая |
| Визуализация | Нет | Да (Stately) |

### Определённые машины

1. **LyricsWizard** (`lyricsWizardMachineConfig`)
   - Состояния: concept → structure → writing → enrichment → validation
   - События: NEXT, BACK, JUMP_TO_*

2. **Generation** (`generationMachineConfig`)
   - Состояния: idle → preparing → validating → generating → processing → success/error
   - События: START, VALIDATE, PROGRESS, COMPLETE, ERROR, RETRY, RESET

## Guards и Actions

```typescript
// Guard: условие для перехода
states: {
  writing: {
    on: {
      NEXT: {
        target: 'enrichment',
        guard: (ctx) => ctx.hasValidLyrics
      }
    }
  }
}

// Entry/Exit actions
states: {
  generating: {
    entry: (ctx) => { ctx.startTime = Date.now(); },
    exit: (ctx) => { ctx.duration = Date.now() - ctx.startTime; }
  }
}
```

## Последствия

### Положительные:
- **Невозможные состояния невозможны**: Типы гарантируют валидные переходы
- **Документация**: Конфигурация машины — это документация flow
- **Тестируемость**: Легко тестировать переходы

### Отрицательные:
- **Нет визуализации**: Нельзя использовать Stately визуализатор
- **Ограниченность**: Нет hierarchical states, parallel states

## Файлы

- `src/lib/stateMachine.ts` — Реализация и конфигурации
