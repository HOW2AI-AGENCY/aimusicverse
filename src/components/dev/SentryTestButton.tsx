/**
 * Sentry Test Button - Development Only
 * 
 * This button triggers a test error to verify Sentry integration is working.
 * Only visible in development environment.
 */

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SentryTestButton() {
  // Only show in development
  if (import.meta.env.PROD) return null;
  
  const triggerError = () => {
    throw new Error('This is your first error!');
  };
  
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={triggerError}
      className="fixed bottom-20 right-4 z-50 shadow-lg"
    >
      <AlertTriangle className="w-4 h-4 mr-2" />
      Break the world
    </Button>
  );
}
