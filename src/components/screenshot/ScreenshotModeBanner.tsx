import { Camera, X } from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';

interface ScreenshotModeBannerProps {
  className?: string;
}

export const ScreenshotModeBanner = ({ className }: ScreenshotModeBannerProps) => {
  const { isScreenshotMode, disableScreenshotMode } = useGuestMode();

  if (!isScreenshotMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[9998] bg-primary/95 backdrop-blur-md ${className}`}
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px))',
      }}
    >
      <div className="container mx-auto px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          <span className="text-xs font-medium text-primary-foreground">
            Screenshot Demo Mode
          </span>
          <span className="text-[10px] text-primary-foreground/70">
            Все данные mock
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={disableScreenshotMode}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};
