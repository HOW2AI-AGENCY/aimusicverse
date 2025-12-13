// MentionInput component - Sprint 011 Phase 5
// @mention autocomplete dropdown

import { useEffect, useRef } from 'react';
import { useMentions } from '@/hooks/comments/useMentions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  searchQuery: string;
  onSelect: (username: string) => void;
  onClose: () => void;
  className?: string;
}

export function MentionInput({ searchQuery, onSelect, onClose, className }: MentionInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: users, isLoading } = useMentions({
    searchQuery,
    enabled: searchQuery.length >= 1,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!searchQuery || searchQuery.length < 1) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute z-50 bottom-full left-0 mb-2 w-full max-w-sm',
        'bg-popover border rounded-lg shadow-lg overflow-hidden',
        className
      )}
    >
      <div className="max-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : users && users.length > 0 ? (
          <div className="py-1">
            {users.map((user) => (
              <button
                key={user.userId}
                onClick={() => onSelect(user.username)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                  <AvatarFallback>
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">
                      {user.displayName || user.username}
                    </span>
                    {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Пользователи не найдены
          </div>
        )}
      </div>
    </div>
  );
}
