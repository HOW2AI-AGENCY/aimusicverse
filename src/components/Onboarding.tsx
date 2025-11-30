import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, Music, FolderOpen, Library } from 'lucide-react';

interface OnboardingProps {
  onComplete?: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Добро пожаловать в MusicVerse!
          </DialogTitle>
          <DialogDescription>
            Краткий гид по созданию вашей первой AI-композиции.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <Music className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Создавайте музыку</h3>
              <p className="text-sm text-muted-foreground">
                Нажмите центральную кнопку (+), чтобы начать генерацию трека.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FolderOpen className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Организуйте проекты</h3>
              <p className="text-sm text-muted-foreground">
                Группируйте треки в альбомы и EP в разделе "Проекты".
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Library className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Сохраняйте в библиотеку</h3>
              <p className="text-sm text-muted-foreground">
                Все сгенерированные треки автоматически сохраняются в "Библиотеке".
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">Начать творить!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
