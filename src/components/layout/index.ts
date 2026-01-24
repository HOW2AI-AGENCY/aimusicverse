/**
 * Layout Components - Unified exports
 * 
 * Import layout components from this index for consistency:
 * 
 * @example
 * ```tsx
 * import { PageContainer, PageHeader, PageSection, FixedOverlay } from '@/components/layout';
 * ```
 */

// Page structure components
export { 
  PageContainer, 
  PageHeader, 
  PageContent, 
  PageSection 
} from './PageContainer';

// Fixed overlay components
export { 
  FixedOverlay, 
  BottomSheetContainer 
} from './FixedOverlay';

// Safe layout components (existing)
export { SafeLayout, SafeHeader } from './SafeLayout';

// Re-export types
export type { PageVariant, PagePadding } from './PageContainer';
