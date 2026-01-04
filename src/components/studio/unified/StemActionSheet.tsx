/**
 * StemActionSheet - Mobile bottom sheet for stem actions
 * Displays context-aware actions based on stem type
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  getGroupedActions,
  normalizeTrackType,
  CATEGORY_LABELS,
  type StemAction,
  type StemType,
} from '@/hooks/studio/stemActionsConfig';

interface StemActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackName: string;
  trackType: string;
  trackColor?: string;
  hasAudio: boolean;
  onAction: (actionId: string) => void;
  disabledActions?: string[];
  disabledReasons?: Record<string, string>;
}

export const StemActionSheet = memo(function StemActionSheet({
  open,
  onOpenChange,
  trackId,
  trackName,
  trackType,
  trackColor = 'hsl(var(--primary))',
  hasAudio,
  onAction,
  disabledActions = [],
  disabledReasons = {},
}: StemActionSheetProps) {
  const haptic = useHapticFeedback();
  const stemType = normalizeTrackType(trackType);
  const groupedActions = getGroupedActions(stemType, hasAudio);

  const handleAction = useCallback((action: StemAction) => {
    if (disabledActions.includes(action.id)) {
      haptic.error();
      return;
    }
    
    haptic.select();
    onAction(action.id);
    onOpenChange(false);
  }, [haptic, onAction, onOpenChange, disabledActions]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border/30 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${trackColor}20` }}
            >
              {getTrackEmoji(stemType)}
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-left truncate">{trackName}</DrawerTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getTrackTypeLabel(stemType)}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-4 space-y-6 pb-safe">
          {/* AI Actions */}
          {groupedActions.ai && groupedActions.ai.length > 0 && (
            <ActionGroup
              label={CATEGORY_LABELS.ai}
              actions={groupedActions.ai}
              onAction={handleAction}
              disabledActions={disabledActions}
              disabledReasons={disabledReasons}
              accentColor="text-primary"
            />
          )}

          {/* Effects */}
          {groupedActions.effects && groupedActions.effects.length > 0 && (
            <ActionGroup
              label={CATEGORY_LABELS.effects}
              actions={groupedActions.effects}
              onAction={handleAction}
              disabledActions={disabledActions}
              disabledReasons={disabledReasons}
              accentColor="text-cyan-400"
            />
          )}

          {/* Edit */}
          {groupedActions.edit && groupedActions.edit.length > 0 && (
            <ActionGroup
              label={CATEGORY_LABELS.edit}
              actions={groupedActions.edit}
              onAction={handleAction}
              disabledActions={disabledActions}
              disabledReasons={disabledReasons}
              accentColor="text-amber-400"
            />
          )}

          {/* Export */}
          {groupedActions.export && groupedActions.export.length > 0 && (
            <ActionGroup
              label={CATEGORY_LABELS.export}
              actions={groupedActions.export}
              onAction={handleAction}
              disabledActions={disabledActions}
              disabledReasons={disabledReasons}
              accentColor="text-green-400"
            />
          )}

          {/* Danger Zone */}
          {groupedActions.danger && groupedActions.danger.length > 0 && (
            <div className="pt-4 border-t border-border/30">
              <ActionGroup
                label=""
                actions={groupedActions.danger}
                onAction={handleAction}
                disabledActions={disabledActions}
                disabledReasons={disabledReasons}
                accentColor="text-destructive"
                isDanger
              />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
});

// Action Group Component
interface ActionGroupProps {
  label: string;
  actions: StemAction[];
  onAction: (action: StemAction) => void;
  disabledActions: string[];
  disabledReasons: Record<string, string>;
  accentColor?: string;
  isDanger?: boolean;
}

const ActionGroup = memo(function ActionGroup({
  label,
  actions,
  onAction,
  disabledActions,
  disabledReasons,
  accentColor = 'text-primary',
  isDanger = false,
}: ActionGroupProps) {
  return (
    <div className="space-y-2">
      {label && (
        <h4 className={cn("text-xs font-medium uppercase tracking-wider", accentColor)}>
          {label}
        </h4>
      )}
      <div className="space-y-1">
        {actions.map((action, index) => {
          const isDisabled = disabledActions.includes(action.id);
          const Icon = action.icon;
          
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onAction(action)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                "touch-manipulation min-h-[52px]",
                isDisabled
                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                  : isDanger
                    ? "hover:bg-destructive/10 active:bg-destructive/20"
                    : "hover:bg-muted active:bg-muted/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isDanger ? "bg-destructive/20" : "bg-muted"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isDanger ? "text-destructive" : accentColor
                )} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isDanger && "text-destructive"
                )}>
                  {action.label}
                </p>
                {action.description && !isDisabled && (
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                )}
                {isDisabled && disabledReasons[action.id] && (
                  <p className="text-xs text-amber-500 truncate">
                    {disabledReasons[action.id]}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

// Helper functions
function getTrackEmoji(stemType: StemType): string {
  const emojiMap: Record<StemType, string> = {
    vocal: '🎤',
    instrumental: '🎸',
    drums: '🥁',
    bass: '🎸',
    guitar: '🎸',
    piano: '🎹',
    main: '🎵',
    stem: '🎚️',
    sfx: '✨',
    other: '🎼',
  };
  return emojiMap[stemType] || '🎵';
}

function getTrackTypeLabel(stemType: StemType): string {
  const labelMap: Record<StemType, string> = {
    vocal: 'Вокал',
    instrumental: 'Инструментал',
    drums: 'Ударные',
    bass: 'Бас',
    guitar: 'Гитара',
    piano: 'Пианино',
    main: 'Основной трек',
    stem: 'Стем',
    sfx: 'Звуковой эффект',
    other: 'Другое',
  };
  return labelMap[stemType] || 'Дорожка';
}
