/**
 * Add Track Dialog - Select track type to add
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipType } from '@/stores/useStudioProjectStore';
import { Sparkles, Mic2, Music, Wand2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: ClipType, action: 'generate' | 'upload') => void;
}

interface TrackTypeOption {
  type: ClipType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  supportsGenerate: boolean;
}

const trackTypes: TrackTypeOption[] = [
  {
    type: 'sfx',
    icon: <Sparkles className="h-6 w-6" />,
    label: 'Звуковой эффект',
    description: 'Сгенерировать SFX через AI',
    color: 'hsl(38 92% 50%)',
    supportsGenerate: true,
  },
  {
    type: 'instrumental',
    icon: <Music className="h-6 w-6" />,
    label: 'Инструментал',
    description: 'Добавить сочетаемый инструментал',
    color: 'hsl(262 83% 58%)',
    supportsGenerate: true,
  },
  {
    type: 'vocal',
    icon: <Mic2 className="h-6 w-6" />,
    label: 'Вокал',
    description: 'Добавить вокальную дорожку',
    color: 'hsl(340 82% 52%)',
    supportsGenerate: true,
  },
  {
    type: 'stem',
    icon: <Wand2 className="h-6 w-6" />,
    label: 'Дорожка',
    description: 'Загрузить свой аудиофайл',
    color: 'hsl(142 76% 36%)',
    supportsGenerate: false,
  },
];

export function AddTrackDialog({ open, onOpenChange, onSelectType }: AddTrackDialogProps) {
  const [selectedType, setSelectedType] = useState<ClipType | null>(null);

  const handleSelect = (type: ClipType, action: 'generate' | 'upload') => {
    onSelectType(type, action);
    onOpenChange(false);
    setSelectedType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить дорожку</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {trackTypes.map((option) => (
            <div
              key={option.type}
              className={cn(
                "p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedType === option.type
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border hover:bg-muted/50"
              )}
              onClick={() => setSelectedType(option.type)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${option.color}20`, color: option.color }}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
              
              {selectedType === option.type && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  {option.supportsGenerate && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSelect(option.type, 'generate')}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Сгенерировать
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSelect(option.type, 'upload')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
