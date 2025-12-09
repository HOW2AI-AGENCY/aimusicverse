import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from '@/lib/sound-effects';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  className?: string;
  size?: 'sm' | 'default';
}

export function SoundToggle({ className, size = 'default' }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(() => soundEffects.isEnabled());

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    soundEffects.setEnabled(newValue);
    
    if (newValue) {
      soundEffects.toggleOn();
    }
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'icon'}
      onClick={toggle}
      className={cn(
        "relative",
        size === 'sm' && "h-8 w-8",
        className
      )}
      title={enabled ? 'Выключить звуки' : 'Включить звуки'}
    >
      {enabled ? (
        <Volume2 className={cn("text-primary", size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
      ) : (
        <VolumeX className={cn("text-muted-foreground", size === 'sm' ? "w-4 h-4" : "w-5 h-5")} />
      )}
    </Button>
  );
}
