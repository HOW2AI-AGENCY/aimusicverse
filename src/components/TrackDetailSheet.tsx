import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Music2, Disc3, Lock } from 'lucide-react';
import type { Track } from '@/types/track';
import { TrackDetailContent } from './track-detail/TrackDetailContent';
import { HeaderVersionSelector } from './track-detail/HeaderVersionSelector';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { FloatingMainButton } from '@/components/ui/FloatingMainButton';
import { GenerateSheet } from '@/components/GenerateSheet';
import { setRemixData, clearRemixData, RemixData } from '@/lib/remix-storage';
import { toast } from 'sonner';

interface TrackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailSheet({ open, onOpenChange, track }: TrackDetailSheetProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
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
  
  // Telegram BackButton integration
  useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });
  
  // Telegram MainButton for Remix
  const { shouldShowUIButton } = useTelegramMainButton({
    text: canRemix ? '🎵 Ремикс' : '🔒 Ремикс запрещён',
    onClick: handleRemixClick,
    visible: open,
    enabled: canRemix,
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary" />
                Детали трека
              </SheetTitle>
              <HeaderVersionSelector
                trackId={track.id}
                activeVersionId={track.active_version_id}
                onVersionChange={setSelectedVersionId}
              />
            </div>
          </SheetHeader>

          <TrackDetailContent 
            track={track} 
            variant="sheet" 
            className="flex-1 mt-4"
          />
        </SheetContent>
      </Sheet>

      {/* Floating Remix Button - shown when Telegram MainButton not available */}
      {shouldShowUIButton && open && (
        <FloatingMainButton
          visible={true}
          text={canRemix ? 'Ремикс' : 'Ремикс запрещён'}
          onClick={handleRemixClick}
          disabled={!canRemix}
          icon={canRemix ? <Disc3 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        />
      )}

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
