import { Button } from '@/components/ui/button';
import { Drum, ArrowRight } from 'lucide-react';
import { ReferenceManager } from '@/services/audio-reference';

interface DrumIntegrationProps {
  onImportDrumPattern?: () => void;
  disabled?: boolean;
}

export function DrumIntegration({ onImportDrumPattern, disabled }: DrumIntegrationProps) {
  const handleImport = () => {
    // Check if there's an active drum reference
    const active = ReferenceManager.getActive();
    
    if (active && active.source === 'drums') {
      onImportDrumPattern?.();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleImport}
      disabled={disabled}
      className="text-xs gap-1.5 h-7"
    >
      <Drum className="h-3 w-3" />
      <span>Импорт бита</span>
      <ArrowRight className="h-3 w-3" />
    </Button>
  );
}
