/**
 * Desktop Layout Components
 *
 * Specialized layouts for optimizing desktop screen space usage.
 * All layouts automatically adapt to mobile with appropriate fallbacks.
 *
 * @module components/layout/desktop
 *
 * @example
 * ```tsx
 * import { DesktopDashboardLayout } from '@/components/layout/desktop';
 *
 * function AnalyticsPage() {
 *   return (
 *     <DesktopDashboardLayout
 *       header={<Header />}
 *       leftColumn={<StatsGrid />}
 *       rightColumn={<Charts />}
 *     />
 *   );
 * }
 * ```
 */

export { DesktopDashboardLayout } from "./DesktopDashboardLayout";
export { DesktopMasterDetailLayout } from "./DesktopMasterDetailLayout";
export { DesktopToolsGridLayout } from "./DesktopToolsGridLayout";
export { DesktopContentLayout } from "./DesktopContentLayout";
