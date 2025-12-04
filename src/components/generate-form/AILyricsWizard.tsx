import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { useLyricsWizardStore } from '@/stores/lyricsWizardStore';
import { ConceptStep } from './lyrics-wizard/ConceptStep';
import { StructureStep } from './lyrics-wizard/StructureStep';
import { WritingStep } from './lyrics-wizard/WritingStep';
import { EnrichmentStep } from './lyrics-wizard/EnrichmentStep';
import { FinalizeStep } from './lyrics-wizard/FinalizeStep';

interface AILyricsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  initialArtistId?: string;
  initialArtistName?: string;
  initialGenre?: string;
  initialMood?: string[];
}

const STEPS = [
  { id: 1, name: 'Концепция', description: 'Тема и настроение' },
  { id: 2, name: 'Структура', description: 'Шаблон песни' },
  { id: 3, name: 'Написание', description: 'Текст секций' },
  { id: 4, name: 'Обогащение', description: 'Мета-теги' },
  { id: 5, name: 'Финализация', description: 'Проверка' },
];

export function AILyricsWizard({
  open,
  onOpenChange,
  onLyricsGenerated,
  onStyleGenerated,
  initialArtistId,
  initialArtistName,
  initialGenre,
  initialMood,
}: AILyricsWizardProps) {
  const {
    step,
    concept,
    structure,
    writing,
    validation,
    setStep,
    nextStep,
    prevStep,
    setGenre,
    setMood,
    setReferenceArtist,
    getFinalLyrics,
    reset,
    isGenerating,
  } = useLyricsWizardStore();

  // Initialize with props
  useEffect(() => {
    if (open) {
      if (initialArtistId && initialArtistName) {
        setReferenceArtist(initialArtistId, initialArtistName);
      }
      if (initialGenre) {
        setGenre(initialGenre);
      }
      if (initialMood && initialMood.length > 0) {
        setMood(initialMood);
      }
    }
  }, [open, initialArtistId, initialArtistName, initialGenre, initialMood, setReferenceArtist, setGenre, setMood]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleApply = () => {
    const lyrics = getFinalLyrics();
    onLyricsGenerated(lyrics);
    reset();
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return concept.theme.trim().length > 0;
      case 2:
        return structure.sections.length > 0;
      case 3:
        return writing.sections.some(s => s.content.trim().length > 0);
      case 4:
        return true; // Tags are optional
      case 5:
        return validation.isValid || validation.warnings.length === 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ConceptStep />;
      case 2:
        return <StructureStep />;
      case 3:
        return <WritingStep onStyleGenerated={onStyleGenerated} />;
      case 4:
        return <EnrichmentStep />;
      case 5:
        return <FinalizeStep />;
      default:
        return null;
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Lyrics Assistant
          </DialogTitle>
          
          {/* Progress */}
          <div className="space-y-2 pt-2">
            <Progress value={progress} className="h-1" />
            <div className="flex justify-between">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => s.id <= step && setStep(s.id)}
                  className={`flex flex-col items-center transition-colors ${
                    s.id === step 
                      ? 'text-primary' 
                      : s.id < step 
                        ? 'text-muted-foreground cursor-pointer hover:text-foreground' 
                        : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                  disabled={s.id > step}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                    s.id === step 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : s.id < step 
                        ? 'border-primary/50 bg-primary/10' 
                        : 'border-muted'
                  }`}>
                    {s.id < step ? <Check className="h-3 w-3" /> : s.id}
                  </div>
                  <span className="text-[10px] mt-1 hidden sm:block">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[400px]">
          {renderStep()}
        </div>

        <DialogFooter className="flex-row justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Отмена
          </Button>
          
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isGenerating}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
            )}
            
            {step < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isGenerating}
                className="gap-1"
              >
                Далее
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={isGenerating}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Применить
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
