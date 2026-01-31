/**
 * Feedback Toast Component
 * Feature: 032-professional-ui
 * 
 * Enhanced toast notifications with animations and icons.
 * Uses sonner under the hood with custom styling.
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastOptions extends ExternalToast {
  /** Toast type determines icon and styling */
  type?: ToastType;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Custom action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const iconStyleMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
  loading: 'text-primary animate-spin',
};

const hapticMap = {
  success: 'success' as const,
  error: 'error' as const,
  info: 'light' as const,
  warning: 'warning' as const,
  loading: 'light' as const,
};

/**
 * Show a styled toast notification
 * 
 * @example
 * showToast('Track saved!', { type: 'success' });
 * showToast('Failed to save', { type: 'error', description: 'Check your connection' });
 * showToast('Processing...', { type: 'loading', duration: 0 });
 */
export function showToast(message: string, options: ToastOptions = {}) {
  const {
    type = 'info',
    haptic = true,
    action,
    duration,
    description,
    ...rest
  } = options;

  // Trigger haptic feedback
  if (haptic && type !== 'loading') {
    triggerHapticFeedback(hapticMap[type]);
  }

  const Icon = iconMap[type];

  return sonnerToast.custom(
    (id) => (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl shadow-lg border',
          'bg-card/95 backdrop-blur-md border-border/50',
          'animate-in slide-in-from-top-2 fade-in-50 duration-300'
        )}
      >
        {/* Icon */}
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyleMap[type])} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {typeof description === 'string' && description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                sonnerToast.dismiss(id);
              }}
              className={cn(
                'mt-2 text-xs font-medium text-primary',
                'hover:text-primary/80 transition-colors'
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="p-1 -m-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    ),
    {
      duration: duration ?? (type === 'error' ? 5000 : type === 'loading' ? Infinity : 3000),
      ...rest,
    }
  );
}

/**
 * Shorthand toast functions
 */
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'success' }),
  
  error: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'error' }),
  
  info: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'info' }),
  
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'warning' }),
  
  loading: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'loading' }),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => sonnerToast.promise(promise, { 
    loading, 
    success: typeof success === 'function' ? (data: T) => success(data) : success, 
    error: typeof error === 'function' ? (err: unknown) => error(err as Error) : error 
  }),
};

export default toast;
