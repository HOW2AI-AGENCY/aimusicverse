/**
 * MobileActionsTab - Quick actions for mobile
 *
 * Features:
 * - Trim track
 * - Extend
 * - Remix
 * - Export
 * - Create arrangement
 * - Share
 */

import {
  Scissors, ArrowRightFromLine, Sparkles, Download,
  Share2, Music2, FolderOpen, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from '@/lib/motion';

interface MobileActionsTabProps {
  trackId?: string;
  mode: 'track' | 'project';
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export default function MobileActionsTab({ trackId, mode }: MobileActionsTabProps) {
  const actions: ActionItem[] = [
    {
      id: 'trim',
      label: 'Обрезать',
      description: 'Обрезать начало или конец трека',
      icon: Scissors,
      color: 'text-blue-500',
      onClick: () => {
        // TODO: Open trim dialog
      }
    },
    {
      id: 'extend',
      label: 'Продлить',
      description: 'Продлить трек на 30-60 секунд',
      icon: ArrowRightFromLine,
      color: 'text-green-500',
      onClick: () => {
        // TODO: Open extend dialog
      }
    },
    {
      id: 'remix',
      label: 'Ремикс',
      description: 'Создать новую версию с изменениями',
      icon: Sparkles,
      color: 'text-purple-500',
      onClick: () => {
        // TODO: Open remix dialog
      }
    },
    {
      id: 'export',
      label: 'Экспорт',
      description: 'Экспортировать микс в MP3/WAV',
      icon: Download,
      color: 'text-orange-500',
      onClick: () => {
        // TODO: Open export dialog
      }
    },
    {
      id: 'arrange',
      label: 'Аранжировка',
      description: 'Создать новую аранжировку',
      icon: Music2,
      color: 'text-pink-500',
      onClick: () => {
        // TODO: Open arrangement dialog
      }
    },
    {
      id: 'share',
      label: 'Поделиться',
      description: 'Поделиться треком в Telegram',
      icon: Share2,
      color: 'text-cyan-500',
      onClick: () => {
        // TODO: Share track
      }
    },
  ];

  if (mode === 'project') {
    actions.push(
      {
        id: 'save',
        label: 'Сохранить',
        description: 'Сохранить изменения проекта',
        icon: Save,
        color: 'text-green-500',
        onClick: () => {
          // TODO: Save project
        }
      },
      {
        id: 'open',
        label: 'Открыть',
        description: 'Открыть другой проект',
        icon: FolderOpen,
        color: 'text-yellow-500',
        onClick: () => {
          // TODO: Open project picker
        }
      }
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Действия</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Быстрые операции с треком
        </p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className="p-4 bg-card rounded-lg border border-border/50 hover:bg-accent/30 transition-all text-left"
          >
            <div className="flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium mb-0.5">{action.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Additional Info */}
      <div className="pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          Больше действий доступно в меню трека
        </p>
      </div>
    </div>
  );
}
