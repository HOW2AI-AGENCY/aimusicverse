/**
 * useConfirm — Phase 6 UI unification
 *
 * Imperative confirmation prompt built on top of `UnifiedDialog` (alert variant).
 * Replaces ad-hoc `<ConfirmationDialog>` plumbing scattered across the app.
 *
 * Provider lives in `ConfirmProvider`; consumers call `useConfirm()` to get an
 * async `confirm()` function that resolves to `true`/`false`.
 *
 * @example
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Удалить трек?',
 *     description: 'Действие необратимо.',
 *     confirmLabel: 'Удалить',
 *     variant: 'destructive',
 *   });
 *   if (ok) await deleteTrack();
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface State {
  open: boolean;
  options: ConfirmOptions | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ open: false, options: null });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState({ open: false, options: null });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return createElement(
    ConfirmContext.Provider,
    { value },
    children,
    state.options
      ? createElement(ConfirmationDialog, {
          open: state.open,
          onOpenChange: (open: boolean) => {
            if (!open) settle(false);
          },
          title: state.options.title,
          description: state.options.description,
          confirmLabel: state.options.confirmLabel,
          cancelLabel: state.options.cancelLabel,
          variant: state.options.variant ?? 'default',
          onConfirm: () => settle(true),
          onCancel: () => settle(false),
        })
      : null,
  );
}

/**
 * Get an imperative `confirm()` function. Must be used inside `ConfirmProvider`.
 * Falls back to `window.confirm` if the provider is missing so consumers don't
 * crash on bootstrap.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (ctx) return ctx;
  return async (opts) =>
    typeof window !== 'undefined'
      ? window.confirm(`${opts.title}\n\n${opts.description}`)
      : false;
}
