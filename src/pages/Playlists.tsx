import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Music2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { usePlaylists } from "@/hooks/usePlaylists";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { PlaylistDetailPreview } from "@/components/playlist/PlaylistDetailPreview";
import { SEOHead } from "@/components/SEOHead";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { EditPlaylistDialog } from "@/components/playlist/EditPlaylistDialog";
import { SharePlaylistDialog } from "@/components/playlist/SharePlaylistDialog";
import { DesktopMasterDetailLayout } from "@/components/layout/desktop";
import type { Playlist } from "@/hooks/usePlaylists";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { UnifiedEmptyState } from "@/components/ui/unified-empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Playlists() {
  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: "/",
  });

  const [searchParams] = useSearchParams();
  const { playlists, isLoading, deletePlaylist } = usePlaylists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [sharingPlaylist, setSharingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const isMobile = useIsMobile();

  const handleDelete = async (playlist: Playlist) => {
    if (confirm(`Удалить плейлист "${playlist.title}"?`)) {
      await deletePlaylist(playlist.id);
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  // Header component
  const Header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Плейлисты</h1>
        {playlists.length > 0 && (
          <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
            {playlists.length} {playlists.length === 1 ? "плейлист" : playlists.length < 5 ? "плейлиста" : "плейлистов"}
          </p>
        )}
      </div>
      <Button
        size="sm"
        onClick={() => setCreateDialogOpen(true)}
        className="lg:h-10 lg:px-4 lg:text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
      >
        <Plus className="h-4 w-4 mr-1 lg:mr-2" />
        Создать
      </Button>
    </div>
  );

  // Playlist grid/list content
  const PlaylistsContent = isLoading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg lg:rounded-xl mb-3" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  ) : playlists.length === 0 ? (
    <UnifiedEmptyState type="playlists" actionLabel="Создать плейлист" onAction={() => setCreateDialogOpen(true)} />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className={cn(
            "transition-all duration-200",
            !isMobile && selectedPlaylist?.id === playlist.id
              ? "ring-2 ring-primary rounded-xl shadow-lg scale-[1.01]"
              : "hover:scale-[1.01] hover:shadow-md",
          )}
        >
          <PlaylistCard
            playlist={playlist}
            formatDuration={formatDuration}
            onOpen={() => {
              if (isMobile) {
                setEditingPlaylist(playlist);
              } else {
                setSelectedPlaylist(playlist);
              }
            }}
            onEdit={() => setEditingPlaylist(playlist)}
            onDelete={() => handleDelete(playlist)}
            onShare={() => setSharingPlaylist(playlist)}
          />
        </div>
      ))}
    </div>
  );

  // Dialogs
  const Dialogs = (
    <>
      <CreatePlaylistDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <EditPlaylistDialog
        playlist={editingPlaylist}
        open={!!editingPlaylist}
        onOpenChange={(open: boolean) => !open && setEditingPlaylist(null)}
      />

      <SharePlaylistDialog
        playlist={sharingPlaylist}
        open={!!sharingPlaylist}
        onOpenChange={(open: boolean) => !open && setSharingPlaylist(null)}
      />
    </>
  );

  // Desktop: Master-Detail layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <DesktopMasterDetailLayout
          header={Header}
          masterContent={PlaylistsContent}
          detailContent={
            selectedPlaylist && (
              <PlaylistDetailPreview
                playlist={selectedPlaylist}
                onEdit={() => setEditingPlaylist(selectedPlaylist)}
                onDelete={() => handleDelete(selectedPlaylist)}
                onShare={() => setSharingPlaylist(selectedPlaylist)}
              />
            )
          }
          hasSelection={!!selectedPlaylist}
          onCloseDetail={() => setSelectedPlaylist(null)}
          detailTitle={selectedPlaylist?.title}
          emptyDetailState={
            <div className="text-center space-y-2">
              <Music2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">Выберите плейлист для просмотра</p>
            </div>
          }
          ratio="default"
        />
        {Dialogs}
      </div>
    );
  }

  // Mobile: Original layout
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead
        title="Плейлисты"
        description="Создавайте и слушайте плейлисты в MusicVerse AI. Сохраняйте подборки треков и делитесь с друзьями."
        canonical="https://aimusicverse.lovable.app/playlists"
      />
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 pb-3"
        style={{
          paddingTop:
            "max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))",
        }}
      >
        {Header}
      </div>

      {/* Content */}
      <div className="p-4">{PlaylistsContent}</div>

      {Dialogs}
    </div>
  );
}
