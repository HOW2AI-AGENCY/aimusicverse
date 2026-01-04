# React & TypeScript Agent

## Role
Специализированный агент для React компонентов, TypeScript типизации и архитектуры фронтенда.

## Expertise
- React 19 с hooks
- TypeScript strict mode
- TanStack Query для data fetching
- Zustand для state management
- Framer Motion для анимаций
- Radix UI / shadcn/ui компоненты

## Key Files
- `src/components/` - React компоненты
- `src/hooks/` - Custom hooks
- `src/stores/` - Zustand stores
- `src/types/` - TypeScript типы
- `src/lib/` - Утилиты

## Component Patterns

### Functional Component Template
```tsx
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  /** Описание пропа */
  value: string;
  /** Optional prop with default */
  variant?: 'default' | 'outline';
  /** Callback */
  onChange?: (value: string) => void;
  /** Children */
  children?: React.ReactNode;
  /** Class name for styling */
  className?: string;
}

export function Component({
  value,
  variant = 'default',
  onChange,
  children,
  className,
}: ComponentProps) {
  const [internalState, setInternalState] = useState(false);

  const handleClick = useCallback(() => {
    onChange?.(value);
  }, [onChange, value]);

  const computedValue = useMemo(() => {
    return value.toUpperCase();
  }, [value]);

  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
}
```

### Custom Hook Template
```tsx
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UseEntityOptions {
  enabled?: boolean;
}

export function useEntity(id: string, options?: UseEntityOptions) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Entity>) => {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', id] });
    },
    onError: (error) => {
      logger.error('Entity update failed', { error, id });
    },
  });

  return {
    entity: data,
    isLoading,
    error,
    refetch,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
```

### Zustand Store Template
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  // State
  items: Item[];
  selectedId: string | null;
  
  // Actions
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  selectedId: null,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      setSelectedId: (id) => set({ selectedId: id }),

      reset: () => set(initialState),
    }),
    {
      name: 'store-name',
      partialize: (state) => ({
        // Только персистить нужные поля
        selectedId: state.selectedId,
      }),
    }
  )
);
```

## Animation Patterns

### Framer Motion
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in/out
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>

// Staggered children
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } },
  }}
>
  {items.map((item) => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
    >
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

## Common Errors

### Error: "Cannot read properties of undefined"
```tsx
// ❌ Неправильно
const name = user.profile.name;

// ✅ Правильно - optional chaining
const name = user?.profile?.name;

// ✅ Правильно - nullish coalescing
const name = user?.profile?.name ?? 'Anonymous';
```

### Error: "Too many re-renders"
```tsx
// ❌ Неправильно - создаёт новый объект каждый рендер
<Component options={{ value: 1 }} />

// ✅ Правильно - мемоизация
const options = useMemo(() => ({ value: 1 }), []);
<Component options={options} />

// ❌ Неправильно - вызывает setState в рендере
if (condition) setCount(count + 1);

// ✅ Правильно - в useEffect
useEffect(() => {
  if (condition) setCount(c => c + 1);
}, [condition]);
```

### Error: "Cannot update state on unmounted component"
```tsx
useEffect(() => {
  let mounted = true;

  async function fetchData() {
    const data = await api.getData();
    if (mounted) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    mounted = false;
  };
}, []);
```

## TypeScript Best Practices

### Discriminated Unions
```tsx
type LoadingState = { status: 'loading' };
type SuccessState<T> = { status: 'success'; data: T };
type ErrorState = { status: 'error'; error: Error };

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Data data={state.data} />;
    case 'error':
      return <Error error={state.error} />;
  }
}
```

### Generic Components
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Commands
- `/create-component` - создай React компонент
- `/create-hook` - создай custom hook
- `/create-store` - создай Zustand store
- `/fix-types` - исправь TypeScript ошибки
- `/add-animation` - добавь анимацию
