// MentionInput Component - Sprint 011 Task T049
// Autocomplete dropdown for @mentions

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMentions } from '@/hooks/comments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  rows?: number;
  className?: string;
  onInsertMention?: (username: string) => void;
}

/**
 * Textarea with @mention autocomplete
 */
export function MentionInput({
  value,
  onChange,
  placeholder = 'Write a comment...',
  disabled = false,
  autoFocus = false,
  rows = 3,
  className,
  onInsertMention,
}: MentionInputProps) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch mention suggestions
  const { users, isLoading } = useMentions(mentionQuery, showDropdown);

  // Detect @mention trigger
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursorPosition = e.target.selectionStart;
      const beforeCursor = newValue.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const afterAt = beforeCursor.substring(lastAtIndex + 1);
        // Only show dropdown if no space after @
        if (!afterAt.includes(' ') && afterAt.length >= 0) {
          setMentionQuery(afterAt);
          setMentionStartPos(lastAtIndex);
          setShowDropdown(true);
          setSelectedIndex(0);
          return;
        }
      }

      // Hide dropdown if @ not found
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStartPos(null);
    },
    [onChange]
  );

  // Insert mention into text
  const insertMention = useCallback(
    (username: string) => {
      if (mentionStartPos === null) return;

      const before = value.substring(0, mentionStartPos);
      const after = value.substring(textareaRef.current?.selectionStart || value.length);
      const newValue = `${before}@${username} ${after}`;

      onChange(newValue);
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStartPos(null);

      // Move cursor after mention
      setTimeout(() => {
        const newCursorPos = mentionStartPos + username.length + 2;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      }, 0);

      onInsertMention?.(username);
    },
    [value, mentionStartPos, onChange, onInsertMention]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showDropdown || users.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, users.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && users[selectedIndex]) {
        e.preventDefault();
        insertMention(users[selectedIndex].username);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, users, selectedIndex, insertMention]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !textareaRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={rows}
        className={cn('resize-none', className)}
      />

      {/* Mention autocomplete dropdown */}
      {showDropdown && (mentionQuery.length >= 2 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full max-w-sm rounded-md border bg-popover p-2 shadow-lg"
        >
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : users.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No users found
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {users.map((user, index) => (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => insertMention(user.username)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>
                      {(user.displayName || user.username)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">
                        {user.displayName || user.username}
                      </span>
                      {user.isVerified && (
                        <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
