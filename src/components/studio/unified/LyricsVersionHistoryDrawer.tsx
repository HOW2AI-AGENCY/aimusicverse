/**
 * LyricsVersionHistoryDrawer Component
 *
 * A mobile-first drawer component for displaying and managing lyric version history.
 * Features virtualized scrolling for large histories, version restoration, comparison,
 * and search/filtering capabilities.
 *
 * @module components/studio/unified/LyricsVersionHistoryDrawer
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  History,
  X,
  Search,
  Clock,
  User,
  FileText,
  RotateCcw,
  GitCompare,
  Loader2,
  AlertCircle,
  Check,
  Filter,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useLyricVersions, useRestoreLyricVersion } from '@/hooks/useLyricVersions';
import { logger } from '@/lib/logger';
import { Virtuoso } from 'react-virtuoso';
import type { LyricVersionWithAuthor } from '@/api/lyrics.api';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the LyricsVersionHistoryDrawer component
 */
export interface LyricsVersionHistoryDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when the drawer is closed */
  onClose: () => void;
  /** The track ID to fetch lyric versions for */
  trackId: string;
  /** Optional callback when a version is successfully restored */
  onVersionRestored?: (versionId: string) => void;
  /** Optional callback when two versions are selected for comparison */
  onCompareVersions?: (versionA: LyricVersionWithAuthor, versionB: LyricVersionWithAuthor) => void;
}

/**
 * Filter options for version history
 */
type VersionFilter = 'all' | 'manual' | 'ai' | 'restore';

/**
 * Sort options for version history
 */
type VersionSort = 'newest' | 'oldest' | 'versionNumber';

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Version item component for displaying a single lyric version
 */
interface VersionItemProps {
  version: LyricVersionWithAuthor;
  isCurrent: boolean;
  isRestoring: boolean;
  searchQuery: string;
  onRestore: (versionId: string) => void;
  onPreview: (version: LyricVersionWithAuthor) => void;
  onSelectForCompare: (version: LyricVersionWithAuthor) => void;
  compareMode: boolean;
  isSelectedForCompare: boolean;
}

const VersionItem = memo(function VersionItem({
  version,
  isCurrent,
  isRestoring,
  searchQuery,
  onRestore,
  onPreview,
  onSelectForCompare,
  compareMode,
  isSelectedForCompare,
}: VersionItemProps) {
  const haptic = useHapticFeedback();

  // Highlight search terms in content preview
  const highlightedContent = useMemo(() => {
    if (!searchQuery) return version.content.slice(0, 200);

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const matches = version.content.match(regex);
    if (!matches) return version.content.slice(0, 200);

    // Find first match and show context around it
    const firstMatchIndex = version.content.toLowerCase().indexOf(searchQuery.toLowerCase());
    const start = Math.max(0, firstMatchIndex - 50);
    const end = Math.min(version.content.length, firstMatchIndex + searchQuery.length + 50);
    const preview = version.content.slice(start, end);

    return preview;
  }, [version.content, searchQuery]);

  // Format date
  const formattedDate = useMemo(() => {
    const date = new Date(version.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }, [version.createdAt]);

  // Get change type icon/color
  const changeTypeConfig = useMemo(() => {
    switch (version.changeType) {
      case 'ai_edit':
        return { icon: '🤖', label: 'AI Edit', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' };
      case 'ai_generate':
        return { icon: '✨', label: 'AI Generated', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' };
      case 'restore':
        return { icon: '🔄', label: 'Restored', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
      case 'manual_edit':
      default:
        return { icon: '✏️', label: 'Manual Edit', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    }
  }, [version.changeType]);

  // Handle restore
  const handleRestore = useCallback(() => {
    haptic.tap();
    onRestore(version.id);
  }, [haptic, onRestore, version.id]);

  // Handle preview
  const handlePreview = useCallback(() => {
    haptic.tap();
    onPreview(version);
  }, [haptic, onPreview, version]);

  // Handle select for compare
  const handleSelectForCompare = useCallback(() => {
    haptic.select();
    onSelectForCompare(version);
  }, [haptic, onSelectForCompare, version]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'p-4 rounded-xl border transition-all',
        'hover:border-border/80 active:scale-[0.98]',
        isCurrent
          ? 'bg-primary/5 border-primary/30'
          : 'bg-card/50 border-border/50 hover:bg-card',
        compareMode && isSelectedForCompare && 'ring-2 ring-primary',
        compareMode && 'cursor-pointer'
      )}
      onClick={compareMode ? handleSelectForCompare : undefined}
    >
      {/* Header: Version number, badges, actions */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Version number */}
          <div className="flex-shrink-0">
            <Badge
              variant={isCurrent ? 'default' : 'secondary'}
              className="text-xs font-mono"
            >
              v{version.versionNumber}
            </Badge>
          </div>

          {/* Current version badge */}
          {isCurrent && (
            <Badge variant="outline" className="text-xs flex-shrink-0">
              <Check className="w-3 h-3 mr-1" />
              Current
            </Badge>
          )}

          {/* Change type badge */}
          <Badge
            variant="outline"
            className={cn('text-xs flex-shrink-0', changeTypeConfig.color)}
          >
            <span className="mr-1">{changeTypeConfig.icon}</span>
            {changeTypeConfig.label}
          </Badge>
        </div>

        {/* Actions dropdown (only in non-compare mode) */}
        {!compareMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                disabled={isRestoring}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                View Full Content
              </DropdownMenuItem>
              {!isCurrent && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="text-primary"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Restore Version
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Version name (if present) */}
      {version.versionName && (
        <div className="text-sm font-medium mb-1">{version.versionName}</div>
      )}

      {/* Change summary (if present) */}
      {version.changeSummary && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {version.changeSummary}
        </div>
      )}

      {/* Content preview */}
      <div className="text-xs text-muted-foreground mb-3 line-clamp-3 font-mono bg-muted/30 rounded p-2">
        {highlightedContent}
        {version.content.length > 200 && '...'}
      </div>

      {/* Footer: Author, date, metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {/* Author */}
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{version.author.username}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        {/* Character count */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <FileText className="w-3.5 h-3.5" />
          <span>{version.content.length} chars</span>
        </div>
      </div>

      {/* Tags (if present) */}
      {version.tags && version.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {version.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {version.tags.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{version.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * LyricsVersionHistoryDrawer Component
 *
 * Displays a scrollable, searchable history of lyric versions with restore and compare functionality.
 *
 * @example
 * ```tsx
 * <LyricsVersionHistoryDrawer
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   trackId="track-uuid"
 *   onVersionRestored={(versionId) => console.log('Restored:', versionId)}
 *   onCompareVersions={(v1, v2) => console.log('Comparing:', v1, v2)}
 * />
 * ```
 */
export const LyricsVersionHistoryDrawer = memo(function LyricsVersionHistoryDrawer({
  open,
  onClose,
  trackId,
  onVersionRestored,
  onCompareVersions,
}: LyricsVersionHistoryDrawerProps) {
  const haptic = useHapticFeedback();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<VersionFilter>('all');
  const [sort, setSort] = useState<VersionSort>('newest');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<LyricVersionWithAuthor[]>([]);
  const [previewVersion, setPreviewVersion] = useState<LyricVersionWithAuthor | null>(null);

  // Queries and mutations
  const { data: versionsData, isLoading, error } = useLyricVersions(trackId);
  const { restoreVersion, isRestoring } = useRestoreLyricVersion();

  // Telegram safe area padding
  const safeAreaTop = `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.5rem, env(safe-area-inset-top, 0px) + 0.5rem))`;
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;

  // Filter and sort versions
  const filteredVersions = useMemo(() => {
    if (!versionsData?.versions) return [];

    let filtered = [...versionsData.versions];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter((v) => {
        if (filter === 'ai') return v.changeType.startsWith('ai');
        if (filter === 'manual') return v.changeType === 'manual_edit';
        if (filter === 'restore') return v.changeType === 'restore';
        return true;
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.content.toLowerCase().includes(query) ||
          v.versionName?.toLowerCase().includes(query) ||
          v.changeSummary?.toLowerCase().includes(query) ||
          v.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'versionNumber') {
        return b.versionNumber - a.versionNumber;
      }
      return 0;
    });

    return filtered;
  }, [versionsData?.versions, filter, searchQuery, sort]);

  // Handle restore
  const handleRestore = useCallback(
    (versionId: string) => {
      restoreVersion(
        { versionId },
        {
          onSuccess: () => {
            onVersionRestored?.(versionId);
          },
        }
      );
    },
    [restoreVersion, onVersionRestored]
  );

  // Handle preview
  const handlePreview = useCallback((version: LyricVersionWithAuthor) => {
    setPreviewVersion(version);
  }, []);

  // Handle select for compare
  const handleSelectForCompare = useCallback(
    (version: LyricVersionWithAuthor) => {
      if (selectedForCompare.find((v) => v.id === version.id)) {
        // Deselect
        setSelectedForCompare((prev) => prev.filter((v) => v.id !== version.id));
      } else if (selectedForCompare.length < 2) {
        // Select (max 2)
        setSelectedForCompare((prev) => [...prev, version]);

        // Trigger compare when 2 versions are selected
        if (selectedForCompare.length === 1) {
          haptic.success();
          onCompareVersions?.(selectedForCompare[0], version);
          setCompareMode(false);
          setSelectedForCompare([]);
        }
      } else {
        // Already have 2 selected, replace first
        haptic.warning();
        setSelectedForCompare([selectedForCompare[1], version]);
      }
    },
    [selectedForCompare, haptic, onCompareVersions]
  );

  // Handle close
  const handleClose = useCallback(() => {
    haptic.tap();
    onClose();
  }, [haptic, onClose]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    haptic.tap();
    setSearchQuery('');
  }, [haptic]);

  // Toggle compare mode
  const handleToggleCompareMode = useCallback(() => {
    haptic.tap();
    setCompareMode((prev) => {
      if (!prev) {
        setSelectedForCompare([]);
      }
      return !prev;
    });
  }, [haptic]);

  // Render version item
  const renderVersionItem = useCallback(
    (index: number, version: LyricVersionWithAuthor) => {
      return (
        <VersionItem
          key={version.id}
          version={version}
          isCurrent={version.isCurrent}
          isRestoring={isRestoring}
          searchQuery={searchQuery}
          onRestore={handleRestore}
          onPreview={handlePreview}
          onSelectForCompare={handleSelectForCompare}
          compareMode={compareMode}
          isSelectedForCompare={selectedForCompare.some((v) => v.id === version.id)}
        />
      );
    },
    [
      isRestoring,
      searchQuery,
      handleRestore,
      handlePreview,
      handleSelectForCompare,
      compareMode,
      selectedForCompare,
    ]
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
          style={{ paddingBottom: safeAreaBottom }}
        >
          {/* Header */}
          <SheetHeader
            className="flex-shrink-0 px-4 py-3 border-b border-border/50"
            style={{ paddingTop: safeAreaTop }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-left text-base">
                    Version History
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    {versionsData?.versions && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {versionsData.versions.length} versions
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Compare mode toggle */}
                <Button
                  variant={compareMode ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-3"
                  onClick={handleToggleCompareMode}
                >
                  <GitCompare className="w-4 h-4 mr-1.5" />
                  Compare
                  {selectedForCompare.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      {selectedForCompare.length}/2
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleClose}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search versions, content, tags..."
                className="pl-9 pr-8 h-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={handleClearSearch}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mt-3">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    {filter === 'all' && 'All'}
                    {filter === 'manual' && 'Manual'}
                    {filter === 'ai' && 'AI'}
                    {filter === 'restore' && 'Restored'}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All Versions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter('manual')}>
                    ✏️ Manual Edits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('ai')}>
                    🤖 AI Generated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('restore')}>
                    🔄 Restored
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    {sort === 'newest' && 'Newest First'}
                    {sort === 'oldest' && 'Oldest First'}
                    {sort === 'versionNumber' && 'By Version'}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setSort('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort('versionNumber')}>
                    By Version Number
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Compare mode indicator */}
              {compareMode && (
                <Badge variant="outline" className="text-xs h-8 px-3 flex items-center gap-1.5">
                  <GitCompare className="w-3 h-3" />
                  Select 2 versions to compare
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => setSelectedForCompare([])}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              // Loading state
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium">Loading versions...</p>
                </div>
              </div>
            ) : error ? (
              // Error state
              <div className="h-full flex items-center justify-center px-4">
                <div className="text-center text-muted-foreground max-w-sm">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
                  <p className="text-sm font-medium mb-1">Failed to load versions</p>
                  <p className="text-xs">
                    {error instanceof Error ? error.message : 'Unknown error'}
                  </p>
                </div>
              </div>
            ) : filteredVersions.length === 0 ? (
              // Empty state
              <div className="h-full flex items-center justify-center px-4">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-1">No versions found</p>
                  <p className="text-xs">
                    {searchQuery || filter !== 'all'
                      ? 'Try adjusting your filters or search query'
                      : 'No lyric versions have been created yet'}
                  </p>
                </div>
              </div>
            ) : (
              // Versions list with virtualization
              <ScrollArea className="h-full">
                <div className="p-4">
                  <Virtuoso
                    style={{ height: 'calc(85vh - 180px)' }}
                    data={filteredVersions}
                    itemContent={renderVersionItem}
                    overscan={200}
                    defaultItemHeight={150}
                  />
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview drawer */}
      <AnimatePresence>
        {previewVersion && (
          <Sheet open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
            <SheetContent
              side="bottom"
              className="h-[70vh] rounded-t-2xl p-0 flex flex-col"
              style={{ paddingBottom: safeAreaBottom }}
            >
              <SheetHeader
                className="flex-shrink-0 px-4 py-3 border-b border-border/50"
                style={{ paddingTop: safeAreaTop }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-left text-base">
                      Version {previewVersion.versionNumber}
                      {previewVersion.versionName && ` - ${previewVersion.versionName}`}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs h-5">
                        {previewVersion.changeType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(previewVersion.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPreviewVersion(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {previewVersion.changeSummary && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Change Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {previewVersion.changeSummary}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">Full Content</h4>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                        {previewVersion.content}
                      </pre>
                    </div>
                  </div>

                  {previewVersion.tags && previewVersion.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewVersion.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
});

export default LyricsVersionHistoryDrawer;
