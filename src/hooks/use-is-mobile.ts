/**
 * Mobile detection hook
 *
 * Per research.md Task 5: Mobile component strategy requires
 * reliable mobile detection for conditional rendering.
 *
 * This is a convenience hook that exports the useIsMobile function
 * from use-media-query.ts for easier importing.
 *
 * @example
 * ```tsx
 * import { useIsMobile } from '@/hooks/use-is-mobile';
 *
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */

export { useIsMobile } from './use-media-query';
