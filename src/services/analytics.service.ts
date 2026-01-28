/**
 * Analytics Service Layer
 * 
 * @deprecated Import from '@/services/analytics' instead.
 * This file re-exports from the modular analytics services for backward compatibility.
 * 
 * Migration guide:
 * - import { trackEvent } from '@/services/analytics.service' 
 * + import { trackEvent } from '@/services/analytics'
 */

// Re-export everything from the modular analytics
export * from './analytics/index';

// Legacy named export for absolute compatibility
export { getOrCreateSessionId } from './analytics/session.service';
