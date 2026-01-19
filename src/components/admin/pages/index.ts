/**
 * Admin Pages Barrel Export
 * 
 * Exports all admin sub-pages for routing.
 * Each page is a self-contained module with its own
 * data fetching, state management, and UI.
 * 
 * Architecture:
 * - AdminLayout provides shell with navigation
 * - Each page uses Suspense for lazy loading
 * - Pages are code-split for optimal bundle size
 * 
 * TODO: Add AdminSettings page
 * TODO: Add AdminTracks page
 * TODO: Add AdminAlerts page
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

// Layout
export { AdminLayout } from './AdminLayout';

// Pages
export { AdminOverview } from './AdminOverview';
export { AdminUsers } from './AdminUsers';
export { AdminEconomy } from './AdminEconomy';
export { AdminAnalytics } from './AdminAnalytics';
export { AdminBot } from './AdminBot';
export { AdminBroadcast } from './AdminBroadcast';
export { AdminModeration } from './AdminModeration';

// Re-export types if needed
// export type { ... } from './types';
