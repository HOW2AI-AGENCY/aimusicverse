/**
 * SaveResultDialog
 * Dialog for choosing how to save generation result
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  GitBranch, 
  PlusCircle, 
  X,
  Music,
  Check,
} from 'lucide-react';

export type SaveResultAction = 'replace' | 'version' | 'new_track' | 'cancel';

interface SaveResultDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (action: SaveResultAction, newName?: string) => void;
  resultAudioUrl: string;
  sourceTrackName: string;
  operationType: 'extend' | 'replace_section' | 'new_arrangement' | 'add_vocals' | 'replace_instrumental';
  existingVersions?: string[];
}

const operationLabels: Record<string, string> = {
  extend: 'Расширение трека',
  replace_section: 'Замена секции',
  new_arrangement: 'Новая аранжировка',
  add_vocals: 'Добавление вокала',
  replace_instrumental: 'Замена инструментала',
};

export function SaveResultDialog({
  open,
  onClose,
  onSave,
  resultAudioUrl,
  sourceTrackName,
  operationType,
  existingVersions = ['A'],
}: SaveResultDialogProps) {
  const [selectedAction, setSelectedAction] = useState<SaveResultAction | null>(null);
  const [newTrackName, setNewTrackName] = useState(`${sourceTrackName} (${operationLabels[operationType]})`);
  
  // Calculate next version label
  const getNextVersionLabel = (): string => {
    const usedLetters = new Set(existingVersions.map(v => v.toUpperCase()));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of alphabet) {
      if (!usedLetters.has(letter)) {
        return letter;
      }
    }
    return `V${existingVersions.length + 1}`;
  };
  
  const nextVersion = getNextVersionLabel();

  const handleConfirm = () => {
    if (!selectedAction) return;
    onSave(selectedAction, selectedAction === 'new_track' ? newTrackName : undefined);
  };

  const options = [
    {
      action: 'replace' as SaveResultAction,
      icon: RefreshCw,
      title: 'Заменить текущий',
      description: 'Заменить аудио текущего трека результатом',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    },
    {
      action: 'version' as SaveResultAction,
      icon: GitBranch,
      title: `Добавить как версию ${nextVersion}`,
      description: 'Сохранить как альтернативную версию трека',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    },
    {
      action: 'new_track' as SaveResultAction,
      icon: PlusCircle,
      title: 'Создать новый трек',
      description: 'Добавить результат как отдельный трек в проект',
      color: 'text-green-400',
      bg: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Сохранить результат
          </DialogTitle>
          <DialogDescription>
            {operationLabels[operationType]} успешно завершено. Как сохранить результат?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedAction === option.action;
            
            return (
              <motion.button
                key={option.action}
                onClick={() => setSelectedAction(option.action)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                  isSelected 
                    ? "ring-2 ring-primary border-primary/50" 
                    : option.bg
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : `bg-background ${option.color}`
                )}>
                  {isSelected ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{option.title}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </motion.button>
            );
          })}

          {/* New track name input */}
          {selectedAction === 'new_track' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2"
            >
              <Label htmlFor="track-name" className="text-xs text-muted-foreground">
                Название нового трека
              </Label>
              <Input
                id="track-name"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="mt-1"
                placeholder="Введите название..."
              />
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onSave('cancel')}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Отменить
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAction}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
