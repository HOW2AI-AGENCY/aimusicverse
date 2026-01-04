/**
 * Remix Button Component
 * Opens GenerateSheet with pre-filled data from source track
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Disc3, Lock } from 'lucide-react';
import type { Track } from '@/types/track';
import { GenerateSheet } from '@/components/GenerateSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { setRemixData, clearRemixData, type RemixData } from '@/lib/remix-storage';

interface RemixButtonProps {
  track: Track;
  className?: string;
}

export function RemixButton({ track, className }: RemixButtonProps) {
  const [generateOpen, setGenerateOpen] = useState(false);
  
  // Check if remix is allowed
  const canRemix = track.allow_remix !== false;
  
  const handleRemixClick = () => {
    if (!canRemix) {
      toast.error('Ремикс запрещён', {
        description: 'Автор трека отключил возможность ремиксов',
      });
      return;
    }
    
    // Store remix data in session storage
    const remixData: RemixData = {
      parentTrackId: track.id,
      parentTrackTitle: track.title || 'Трек',
      title: `${track.title || 'Трек'} (Remix)`,
      style: track.style || '',
      lyrics: track.lyrics || '',
      tags: track.tags || '',
    };
    
    setRemixData(remixData);
    setGenerateOpen(true);
  };
  
  return (
    <>
      <Button
        variant="default"
        size="lg"
        className={cn(
          "w-full gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90",
          !canRemix && "opacity-50",
          className
        )}
        onClick={handleRemixClick}
      >
        {canRemix ? (
          <>
            <Disc3 className="w-5 h-5" />
            Ремикс
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Ремикс запрещён
          </>
        )}
      </Button>
      
      <GenerateSheet
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);
          if (!open) {
            clearRemixData();
          }
        }}
      />
    </>
  );
}
