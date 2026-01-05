/**
 * Sentry Test Button - TEMPORARY
 * 
 * Use to verify Sentry integration, then remove
 */

import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSentryEnabled } from '@/lib/sentry';

export function SentryTestButton() {
  const triggerError = () => {
    const testError = new Error('Sentry Test Error - Verification Complete!');
    
    // Capture directly to Sentry (bypasses beforeSend filters)
    Sentry.captureException(testError, {
      tags: { type: 'test', source: 'verification_button' },
      level: 'error',
    });
    
    console.log('[Sentry Test] Error sent to Sentry. DSN enabled:', isSentryEnabled);
    alert('Тестовая ошибка отправлена в Sentry! Проверьте dashboard.');
  };
  
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={triggerError}
      className="fixed bottom-20 right-4 z-[9999] shadow-lg"
    >
      <AlertTriangle className="w-4 h-4 mr-2" />
      Test Sentry
    </Button>
  );
}
