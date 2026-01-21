/**
 * User-Friendly Error Component
 * Feature: Sprint 032 - US-003 User-Friendly Error Messages
 *
 * Displays errors in a user-friendly format with actionable next steps
 */

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { AlertTriangle, RefreshCw, X, Info, ExternalLink, Lightbulb, ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { UserFriendlyError } from '@/lib/suno-error-mapper';

interface UserFriendlyErrorProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

const ERROR_ICONS = {
  warning: AlertTriangle,
  info: Info,
} as const;

/**
 * User-Friendly Error Display Component
 */
export const UserFriendlyErrorDisplay = memo(function UserFriendlyErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  variant = 'card',
}: UserFriendlyErrorProps) {
  const ErrorIcon = ERROR_ICONS.warning;

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const navigate = useNavigate();
  const [showExamples, setShowExamples] = useState(false);

  const handleContactSupport = useCallback(() => {
    // Open Telegram support or email
    const telegramSupport = 'https://t.me/musicverse_support';
    window.open(telegramSupport, '_blank');
  }, []);

  const handleFaqClick = useCallback(() => {
    if (error.faqLink) {
      navigate(error.faqLink);
    }
  }, [error.faqLink, navigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative overflow-hidden',
          variant === 'inline' && 'p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50',
          variant === 'card' && 'p-4 sm:p-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50',
          variant === 'banner' && 'p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-200/50 dark:border-red-900/50',
          className
        )}
      >
        {/* Error icon */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <ErrorIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>

          {/* Error content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-sm sm:text-base text-red-900 dark:text-red-100 mb-1">
              {error.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              {error.message}
            </p>

            {/* Hint */}
            {error.hint && (
              <div className="flex items-start gap-2 p-2 mb-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {error.hint}
                </p>
              </div>
            )}

            {/* Examples (for content policy errors) */}
            {error.examples && error.examples.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showExamples && "rotate-180")} />
                  {showExamples ? 'Скрыть примеры' : 'Показать примеры исправления'}
                </button>
                {showExamples && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {error.examples.map((example, idx) => (
                      <li key={idx} className="text-xs text-red-700 dark:text-red-300 list-disc">
                        {example}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {error.retryable && onRetry && (
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {error.action}
                </Button>
              )}

              {error.faqLink && (
                <Button
                  onClick={handleFaqClick}
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Подробнее
                </Button>
              )}

              {!error.retryable && (
                <Button
                  onClick={handleContactSupport}
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Написать в поддержку
                </Button>
              )}

              {onDismiss && (
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  Закрыть
                </Button>
              )}
            </div>

            {/* Technical details (expandable) */}
            {error.technical && (
              <details className="mt-3 group">
                <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                  Технические детали
                </summary>
                <pre className="mt-2 p-2 text-xs bg-red-100/50 dark:bg-red-900/20 rounded overflow-x-auto text-red-800 dark:text-red-300">
                  {error.technical}
                </pre>
              </details>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && variant !== 'inline' && (
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

/**
 * Error Toast Component (for Sonner)
 */
export const ErrorToast = memo(function ErrorToast({
  error,
  onRetry,
}: {
  error: UserFriendlyError;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
      <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-red-900 dark:text-red-100">
          {error.title}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
          {error.message}
        </p>
        {error.hint && (
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5 flex items-start gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error.hint}
          </p>
        )}
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            {error.action}
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Inline Error Component (compact)
 */
export const InlineError = memo(function InlineError({
  error,
  onRetry,
}: {
  error: UserFriendlyError;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-300 flex-1">
        {error.title}: {error.message}
      </p>
      {error.retryable && onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
});

/**
 * Error State Component (for full-page errors)
 */
export const ErrorState = memo(function ErrorState({
  error,
  onRetry,
}: {
  error: UserFriendlyError;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"
      >
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </motion.div>

      <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
        {error.title}
      </h2>

      <p className="text-red-700 dark:text-red-300 mb-6 max-w-md">
        {error.message}
      </p>

      <div className="flex gap-3">
        {error.retryable && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="w-4 h-4" />
            {error.action}
          </Button>
        )}
        <Button
          onClick={() => window.location.reload()}
          variant="ghost"
          className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          Обновить страницу
        </Button>
      </div>
    </div>
  );
});
