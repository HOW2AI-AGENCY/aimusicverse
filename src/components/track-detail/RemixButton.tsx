/**
 * Remix Button Component
 * Opens GenerateSheet with pre-filled data from source track
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Disc3, Lock } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { GenerateSheet } from '@/components/GenerateSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RemixButtonProps {
  track: Track;
  className?: string;
}

// Session storage key for remix data
const REMIX_DATA_KEY = 'musicverse_remix_data';

export interface RemixData {
  parentTrackId: string;
  parentTrackTitle: string;
  title: string;
  style: string;
  lyrics: string;
  tags: string;
}

export function setRemixData(data: RemixData) {
  sessionStorage.setItem(REMIX_DATA_KEY, JSON.stringify(data));
}

export function getRemixData(): RemixData | null {
  const data = sessionStorage.getItem(REMIX_DATA_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearRemixData() {
  sessionStorage.removeItem(REMIX_DATA_KEY);
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
