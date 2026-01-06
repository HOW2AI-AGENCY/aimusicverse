/**
 * MobileActionsContent - Quick actions for mobile studio
 * Grid of action buttons for common operations
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import {
  Scissors, ArrowRightFromLine, Sparkles, Download,
  Share2, Music2, Save, FolderOpen, Settings, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { StudioProject } from '@/stores/useUnifiedStudioStore';

interface MobileActionsContentProps {
  project: StudioProject;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onExport: () => void;
  onDownloadStems?: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

export const MobileActionsContent = memo(function MobileActionsContent({
  project,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onExport,
  onDownloadStems,
}: MobileActionsContentProps) {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();

  const handleShare = useCallback(() => {
    haptic.select();
    const shareUrl = `${window.location.origin}/studio-v2/project/${project.id}`;
    const shareText = `Послушай мой проект "${project.name}" 🎵`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encoded}`);
    } else if (navigator.share) {
      navigator.share({
        title: project.name,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Ссылка скопирована!');
    }
  }, [project, haptic]);

  const handleSave = useCallback(() => {
    haptic.success();
    onSave();
  }, [onSave, haptic]);

  const handleExport = useCallback(() => {
    haptic.select();
    onExport();
  }, [onExport, haptic]);

  const handleDownloadStems = useCallback(() => {
    if (onDownloadStems) {
      haptic.select();
      onDownloadStems();
    }
  }, [onDownloadStems, haptic]);

  const handleNavigate = useCallback((path: string) => {
    haptic.select();
    navigate(path);
  }, [navigate, haptic]);

  const handleInfoAction = useCallback((message: string) => {
    haptic.tap();
    toast.info(message);
  }, [haptic]);

  const handleDeleteProject = useCallback(() => {
    haptic.warning();
    toast.info('Удаление проекта в разработке');
  }, [haptic]);

  const actions: ActionItem[] = [
    {
      id: 'save',
      label: 'Сохранить',
      description: hasUnsavedChanges ? 'Есть несохранённые изменения' : 'Всё сохранено',
      icon: Save,
      color: hasUnsavedChanges ? 'text-primary' : 'text-green-500',
      onClick: handleSave,
      disabled: isSaving || !hasUnsavedChanges,
    },
    {
      id: 'export',
      label: 'Экспорт',
      description: 'Экспортировать микс в MP3/WAV',
      icon: Download,
      color: 'text-orange-500',
      onClick: handleExport,
    },
    {
      id: 'download-stems',
      label: 'Стемы',
      description: 'Скачать отдельные дорожки',
      icon: Download,
      color: 'text-emerald-500',
      onClick: handleDownloadStems,
      disabled: !onDownloadStems,
    },
    {
      id: 'share',
      label: 'Поделиться',
      description: 'Поделиться проектом',
      icon: Share2,
      color: 'text-cyan-500',
      onClick: handleShare,
    },
    {
      id: 'trim',
      label: 'Обрезать',
      description: 'Обрезать начало или конец',
      icon: Scissors,
      color: 'text-blue-500',
      onClick: () => handleInfoAction('Функция в разработке'),
    },
    {
      id: 'remix',
      label: 'Ремикс',
      description: 'Создать новую версию',
      icon: Sparkles,
      color: 'text-purple-500',
      onClick: () => handleInfoAction('Функция в разработке'),
    },
    {
      id: 'arrange',
      label: 'Аранжировка',
      description: 'Создать новую аранжировку',
      icon: Music2,
      color: 'text-pink-500',
      onClick: () => handleInfoAction('Функция в разработке'),
    },
    {
      id: 'open',
      label: 'Проекты',
      description: 'Открыть другой проект',
      icon: FolderOpen,
      color: 'text-yellow-500',
      onClick: () => handleNavigate('/studio-v2'),
    },
    {
      id: 'settings',
      label: 'Настройки',
      description: 'Настройки проекта',
      icon: Settings,
      color: 'text-muted-foreground',
      onClick: () => handleInfoAction('Функция в разработке'),
    },
  ];

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Действия</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Быстрые операции с проектом
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
            disabled={action.disabled}
            className="p-4 bg-card rounded-xl border border-border/60 hover:bg-accent/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <div className="flex flex-col gap-2.5">
              <div className={`w-11 h-11 rounded-xl bg-muted/80 flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
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

      {/* Danger Zone */}
      <div className="pt-4 border-t border-border/30">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleDeleteProject}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить проект
        </Button>
      </div>
    </div>
  );
});
