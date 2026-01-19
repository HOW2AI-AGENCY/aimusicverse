/**
 * AdminTracks - Tracks management tab
 */
import { useState } from "react";
import { useAdminTracks } from "@/hooks/useAdminTracks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Music, Search, Globe, Lock } from "lucide-react";
import { AdminTrackDetailsDialog } from "@/components/admin/AdminTrackDetailsDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminTracks() {
  const [trackSearch, setTrackSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const isMobile = useIsMobile();

  const { data: tracks, isLoading: tracksLoading } = useAdminTracks(trackSearch, 100);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Music className="h-5 w-5" />
            Треки ({tracks?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[400px] md:h-[500px]">
            {tracksLoading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : (
              <div className="space-y-2">
                {tracks?.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTrack(track)}
                  >
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Music className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm md:text-base truncate">{track.title || "Без названия"}</div>
                      <div className="text-xs md:text-sm text-muted-foreground truncate">
                        @{track.creator_username || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      {track.is_public ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={track.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {track.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <AdminTrackDetailsDialog
        open={!!selectedTrack}
        onOpenChange={(open) => !open && setSelectedTrack(null)}
        track={selectedTrack}
      />
    </>
  );
}
