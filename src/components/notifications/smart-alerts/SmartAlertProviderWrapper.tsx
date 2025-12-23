import React from 'react';
import { SmartAlertProvider } from './SmartAlertProvider';

/**
 * Wrapper component for SmartAlertProvider that can be used outside of Router context.
 * The actual SmartAlertProvider is rendered inside BrowserRouter in MainLayout.
 */
export function SmartAlertProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Export the actual provider for use inside Router
export { SmartAlertProvider } from './SmartAlertProvider';
