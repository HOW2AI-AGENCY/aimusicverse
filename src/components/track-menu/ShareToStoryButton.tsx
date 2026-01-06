import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { telegramShareService } from '@/services/telegram';
import { toast } from 'sonner';

interface Track {
  id: string;
  title?: string | null;
  cover_url?: string | null;
}

interface ShareToStoryButtonProps {
  track: Track;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareToStoryButton({ 
  track, 
  variant = 'outline', 
  size = 'default',
  className 
}: ShareToStoryButtonProps) {
  const { webApp } = useTelegram();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(telegramShareService.canShareToStory());
  }, [webApp]);

  const handleShare = () => {
    if (!track.cover_url) {
      toast.error('Нет обложки для истории');
      return;
    }

    const success = telegramShareService.shareToStory(track);
    
    if (!success) {
      toast.error('Stories не поддерживаются на этой платформе');
    }
  };

  // Don't render if not supported or no cover
  if (!isSupported || !track.cover_url) {
    return null;
  }

  return (
    <Button 
      onClick={handleShare} 
      variant={variant} 
      size={size}
      className={className}
    >
      <Camera className="h-4 w-4 mr-2" />
      В историю
    </Button>
  );
}
