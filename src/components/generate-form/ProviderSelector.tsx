/**
 * Provider selector component for generation form
 * Currently only Suno AI is supported
 */

import { memo } from 'react';

export type GenerationProvider = 'suno';

// Simplified - only Suno provider
export const ProviderSelector = memo(function ProviderSelector() {
  // No UI needed - only one provider
  return null;
});

// Export empty providers for backward compatibility
export const PROVIDERS = [];
