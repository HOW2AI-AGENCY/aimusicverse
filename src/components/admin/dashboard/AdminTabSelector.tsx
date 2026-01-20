/**
 * Admin Tab Selector Component
 * 
 * Responsive tab selector for admin dashboard.
 * Shows dropdown on mobile, horizontal tabs on desktop.
 * 
 * @module components/admin/dashboard/AdminTabSelector
 */

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Music, FolderKanban, ListMusic, Activity, 
  TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle,
  Shield, RefreshCw, BookOpen, Search, Play, Globe, Lock,
  Coins, MessageSquare, Eye, Crown, ChevronDown, Menu,
  LucideIcon
} from 'lucide-react';
import { ADMIN_TAB_OPTIONS, type AdminTabType } from '@/hooks/admin/useAdminDashboard';

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Map icon names to Lucide components
 * 
 * NOTE: We use a string mapping instead of storing components in the config
 * to keep the config serializable and avoid circular dependencies.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  TrendingUp,
  Music,
  Coins,
  Users,
  AlertTriangle,
  MessageSquare,
  Crown,
  Globe,
  Clock,
};

/**
 * Get icon component by name
 */
function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Activity;
}

// ============================================================================
// Props
// ============================================================================

interface AdminTabSelectorProps {
  /** Currently active tab */
  activeTab: AdminTabType;
  /** Callback when tab changes */
  onTabChange: (tab: AdminTabType) => void;
  /** Whether to use mobile layout (dropdown) */
  isMobile: boolean;
}

// ============================================================================
// Mobile Selector Component
// ============================================================================

/**
 * Mobile dropdown selector for tabs
 */
function MobileTabSelector({ 
  activeTab, 
  onTabChange 
}: Omit<AdminTabSelectorProps, 'isMobile'>) {
  const currentTab = ADMIN_TAB_OPTIONS.find((t) => t.value === activeTab);
  const CurrentIcon = currentTab ? getIcon(currentTab.iconName) : Activity;
  
  return (
    <Select value={activeTab} onValueChange={(value) => onTabChange(value as AdminTabType)}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <CurrentIcon className="h-4 w-4 flex-shrink-0" />
          <span>{currentTab?.label || 'Обзор'}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {ADMIN_TAB_OPTIONS.map((tab) => {
          const TabIcon = getIcon(tab.iconName);
          return (
            <SelectItem key={tab.value} value={tab.value} className="pl-2">
              <div className="flex items-center gap-2">
                <TabIcon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Desktop Tabs Component
// ============================================================================

/**
 * Desktop horizontal tabs with scroll
 */
function DesktopTabSelector({ 
  activeTab, 
  onTabChange 
}: Omit<AdminTabSelectorProps, 'isMobile'>) {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => onTabChange(value as AdminTabType)} 
      className="space-y-4"
    >
      <ScrollArea className="w-full">
        <TabsList className="inline-flex w-max">
          {ADMIN_TAB_OPTIONS.map((tab) => {
            const TabIcon = getIcon(tab.iconName);
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex items-center gap-1.5"
              >
                <TabIcon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </ScrollArea>
    </Tabs>
  );
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Responsive admin tab selector
 * 
 * Automatically switches between mobile dropdown and desktop tabs
 * based on the isMobile prop.
 * 
 * @example
 * ```tsx
 * <AdminTabSelector
 *   activeTab={dashboard.activeTab}
 *   onTabChange={dashboard.setActiveTab}
 *   isMobile={dashboard.isMobile}
 * />
 * ```
 */
export function AdminTabSelector({ 
  activeTab, 
  onTabChange, 
  isMobile 
}: AdminTabSelectorProps) {
  if (isMobile) {
    return <MobileTabSelector activeTab={activeTab} onTabChange={onTabChange} />;
  }
  
  return <DesktopTabSelector activeTab={activeTab} onTabChange={onTabChange} />;
}
