import { forwardRef, useCallback } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface Artist {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  genre_tags: string[] | null;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

interface VirtualizedArtistsListProps {
  artists: Artist[];
  onSelect: (artist: Artist) => void;
}

// Grid container component
const GridContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-0"
    />
  )
);
GridContainer.displayName = "GridContainer";

// Item wrapper for grid
const GridItemWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className="w-full">{children}</div>
  )
);
GridItemWrapper.displayName = "GridItemWrapper";

export function VirtualizedArtistsList({
  artists,
  onSelect,
}: VirtualizedArtistsListProps) {
  const renderArtistItem = useCallback((index: number, artist: Artist) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={() => onSelect(artist)}
        className={cn(
          "relative group p-3 rounded-xl bg-card/50 border border-border/50",
          "hover:bg-card hover:border-border cursor-pointer transition-all",
          "active:scale-[0.98] touch-manipulation"
        )}
      >
        {/* Avatar */}
        <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-2">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-medium text-sm truncate">{artist.name}</h3>
        {artist.genre_tags && artist.genre_tags.length > 0 && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {artist.genre_tags.slice(0, 2).join(', ')}
          </p>
        )}

        {/* Public badge */}
        {artist.is_public && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium">
            Public
          </div>
        )}
      </motion.div>
    );
  }, [onSelect]);

  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={artists.length}
      overscan={200}
      components={{
        List: GridContainer,
        Item: GridItemWrapper,
      }}
      itemContent={(index) => renderArtistItem(index, artists[index])}
    />
  );
}
