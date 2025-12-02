import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Track } from '@/hooks/useTracksOptimized';
import { Share2, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function ShareTrackDialog({ open, onOpenChange, track }: ShareTrackDialogProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate public share URL
  useEffect(() => {
    if (open && track) {
      setLoading(true);
      
      // Generate share URL (placeholder - replace with actual API call)
      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/share/track/${track.id}`;
      
      // Simulate API call
      setTimeout(() => {
        setShareUrl(publicUrl);
        setLoading(false);
      }, 500);
    }
  }, [open, track]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title || 'Check out this track',
          text: `Listen to "${track.title}" on MusicVerse AI`,
          url: shareUrl,
        });
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback to copying
      handleCopy();
    }
  };

  const handleOpenInBrowser = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Track
          </DialogTitle>
          <DialogDescription>
            Share "{track.title}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Track Preview */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            {track.cover_url && (
              <img
                src={track.cover_url}
                alt={track.title || 'Track'}
                className="w-20 h-20 rounded-md object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{track.title}</p>
              {track.style && (
                <p className="text-sm text-muted-foreground">{track.style}</p>
              )}
              {track.duration_seconds && (
                <p className="text-xs text-muted-foreground mt-1">
                  Duration: {Math.floor(track.duration_seconds / 60)}:
                  {String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Public Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className={cn(
                  'flex-1 font-mono text-sm',
                  loading && 'animate-pulse'
                )}
                placeholder={loading ? 'Generating link...' : ''}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={loading || !shareUrl}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view and listen to this track
            </p>
          </div>

          {/* Share Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleOpenInBrowser}
              disabled={loading || !shareUrl}
            >
              <ExternalLink className="h-4 w-4" />
              Open in Browser
            </Button>
            {navigator.share && (
              <Button
                className="flex-1 gap-2"
                onClick={handleShare}
                disabled={loading || !shareUrl}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>

          {/* Social Share Buttons (Optional) */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Share on social media</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out "${track.title}"`)}`;
                  window.open(telegramUrl, '_blank');
                }}
                disabled={loading || !shareUrl}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.563 7.344c-.117.552-.425.687-.862.428l-2.381-1.753-1.147 1.103c-.127.127-.233.233-.479.233l.171-2.422 4.401-3.973c.191-.171-.042-.267-.296-.095l-5.441 3.424-2.343-.73c-.51-.159-.52-.51.107-.755l9.159-3.529c.425-.16.798.099.656.755z"/>
                </svg>
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${track.title}"`)}&url=${encodeURIComponent(shareUrl)}`;
                  window.open(twitterUrl, '_blank');
                }}
                disabled={loading || !shareUrl}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out "${track.title}": ${shareUrl}`)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                disabled={loading || !shareUrl}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
