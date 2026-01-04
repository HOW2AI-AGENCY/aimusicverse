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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  GitBranch, 
  PlusCircle, 
  X,
  Music,
  Check,
  Info,
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

const operationDescriptions: Record<string, string> = {
  extend: 'Трек был успешно продлён. Выберите как сохранить результат.',
  replace_section: 'Секция успешно заменена. Выберите как сохранить результат.',
  new_arrangement: 'Новая аранжировка готова. Выберите как сохранить результат.',
  add_vocals: 'Вокал добавлен к инструменталу. Выберите как сохранить результат.',
  replace_instrumental: 'Инструментал успешно заменён. Выберите как сохранить результат.',
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
  const [selectedAction, setSelectedAction] = useState<SaveResultAction>('version');
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Сохранить результат
          </DialogTitle>
          <DialogDescription>
            {operationDescriptions[operationType] || 'Выберите как сохранить результат.'}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedAction}
          onValueChange={(v) => setSelectedAction(v as SaveResultAction)}
          className="space-y-3 py-4"
        >
          {/* Replace current */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
            selectedAction === 'replace' 
              ? "ring-2 ring-primary border-primary/50 bg-primary/5" 
              : "border-border/50 hover:border-border hover:bg-muted/30"
          )}
            onClick={() => setSelectedAction('replace')}
          >
            <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="replace" className="font-medium text-sm cursor-pointer">
                Заменить текущий трек
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Заменить audio_url текущего трека на новый результат
              </p>
            </div>
            <RefreshCw className={cn(
              "w-5 h-5 shrink-0",
              selectedAction === 'replace' ? "text-primary" : "text-amber-400"
            )} />
          </div>

          {/* Add as version */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
            selectedAction === 'version' 
              ? "ring-2 ring-primary border-primary/50 bg-primary/5" 
              : "border-border/50 hover:border-border hover:bg-muted/30"
          )}
            onClick={() => setSelectedAction('version')}
          >
            <RadioGroupItem value="version" id="version" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="version" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                Добавить как версию {nextVersion}
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                  Рекомендуется
                </span>
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Сохранить оригинал, добавить новую версию для сравнения
              </p>
            </div>
            <GitBranch className={cn(
              "w-5 h-5 shrink-0",
              selectedAction === 'version' ? "text-primary" : "text-blue-400"
            )} />
          </div>

          {/* Create new track */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
            selectedAction === 'new_track' 
              ? "ring-2 ring-primary border-primary/50 bg-primary/5" 
              : "border-border/50 hover:border-border hover:bg-muted/30"
          )}
            onClick={() => setSelectedAction('new_track')}
          >
            <RadioGroupItem value="new_track" id="new_track" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <Label htmlFor="new_track" className="font-medium text-sm cursor-pointer">
                Создать новый трек
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Добавить результат как отдельный трек в проект
              </p>
            </div>
            <PlusCircle className={cn(
              "w-5 h-5 shrink-0",
              selectedAction === 'new_track' ? "text-primary" : "text-green-400"
            )} />
          </div>
        </RadioGroup>

        {/* New track name input */}
        {selectedAction === 'new_track' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label htmlFor="track-name" className="text-xs text-muted-foreground">
              Название нового трека
            </Label>
            <Input
              id="track-name"
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              placeholder="Введите название..."
            />
          </motion.div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            При добавлении версии вы сможете переключаться между вариантами A/B/{nextVersion} в студии.
          </span>
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
