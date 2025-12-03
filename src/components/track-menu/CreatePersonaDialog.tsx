import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Track } from '@/hooks/useTracksOptimized';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useArtists } from '@/hooks/useArtists';
import { hapticImpact, hapticNotification } from '@/lib/haptic';

interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function CreatePersonaDialog({ open, onOpenChange, track }: CreatePersonaDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { createArtist } = useArtists();

  // Pre-fill with track style
  const suggestedName = track.style ? `${track.style} Artist` : '';
  const suggestedDescription = track.style 
    ? `AI persona based on ${track.style} style from "${track.title}"`
    : `AI persona based on "${track.title}"`;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a persona name');
      return;
    }

    setLoading(true);
    
    try {
      hapticImpact('medium');

      await createArtist({
        name: name.trim(),
        bio: description.trim() || suggestedDescription,
        style_description: track.style || '',
        avatar_url: track.cover_url || null,
      });

      hapticNotification('success');
      toast.success('Persona created successfully');
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create persona:', error);
      toast.error('Failed to create persona. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create AI Persona
          </DialogTitle>
          <DialogDescription>
            Create an AI persona based on the style of "{track.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            {track.cover_url && (
              <img
                src={track.cover_url}
                alt={track.title || 'Track'}
                className="w-16 h-16 rounded-md object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{track.title}</p>
              {track.style && (
                <p className="text-xs text-muted-foreground">Style: {track.style}</p>
              )}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="persona-name">Persona Name *</Label>
            <Input
              id="persona-name"
              placeholder={suggestedName || 'e.g., Jazz Virtuoso'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="persona-description">Description (Optional)</Label>
            <Textarea
              id="persona-description"
              placeholder={suggestedDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This persona will inherit the musical style from the selected track
            </p>
          </div>

          {/* Style Badge */}
          {track.style && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Auto-filled style:</span>
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                {track.style}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Persona
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
