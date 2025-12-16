/**
 * Clean Studio Layout
 * 
 * Unified responsive layout for section replacement workflow:
 * - Header with track info and version selector
 * - Collapsible synchronized lyrics
 * - Waveform timeline with integrated sections
 * - Section editor (inline on desktop, bottom sheet on mobile)
 * - Player controls
 */

import { ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CleanStudioLayoutProps {
  trackTitle: string;
  trackCoverUrl?: string | null;
  versionsCount?: number;
  currentVersion?: string;
  onVersionSelect?: () => void;
  children: ReactNode;
  playerBar: ReactNode;
  menuItems?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  }>;
  className?: string;
}

export function CleanStudioLayout({
  trackTitle,
  trackCoverUrl,
  versionsCount = 1,
  currentVersion,
  onVersionSelect,
  children,
  playerBar,
  menuItems = [],
  className,
}: CleanStudioLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('h-screen flex flex-col bg-background overflow-hidden', className)}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            className="h-9 w-9 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {trackCoverUrl && (
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img 
                  src={trackCoverUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm truncate">
                {trackTitle || 'Без названия'}
              </h1>
              
              {versionsCount > 1 && (
                <button
                  onClick={onVersionSelect}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {currentVersion || `v${versionsCount}`}
                  </Badge>
                  <span className="hidden sm:inline">
                    {versionsCount} версий
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        {menuItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, idx) => (
                <DropdownMenuItem key={idx} onClick={item.onClick}>
                  {item.icon}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Player Bar */}
      <div className="flex-shrink-0 border-t border-border/50 bg-card/50 backdrop-blur-sm safe-area-bottom">
        {playerBar}
      </div>
    </div>
  );
}
