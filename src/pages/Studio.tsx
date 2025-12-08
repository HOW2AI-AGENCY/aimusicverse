import { useNavigate } from "react-router-dom";
import { MessageBubble } from "@/components/MessageBubble";
import { TelegramButton } from "@/components/TelegramButton";
import { Music, Library, Folder, Settings, Info, Sparkles, Layers, Scissors, Mic, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { useTracks } from "@/hooks/useTracksOptimized";

const Studio = () => {
  const navigate = useNavigate();
  const { tracks } = useTracks();
  
  // Get recent tracks with audio for studio quick access
  const recentTracks = tracks
    ?.filter(t => t.audio_url && t.status === 'completed')
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Main Menu Card */}
        <MessageBubble
          image={logo}
          title="MusicVerse Studio"
          subtitle="Создавайте музыку с помощью искусственного интеллекта"
          status="success"
        >
          <div className="space-y-2">
            {/* Primary Action */}
            <TelegramButton
              className="w-full bg-gradient-telegram text-white font-semibold h-12"
              icon="🚀"
              haptic="success"
              onClick={() => navigate("/generate")}
            >
              СОЗДАТЬ ТРЕК
            </TelegramButton>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 gap-2">
              <TelegramButton
                variant="outline"
                className="glass border-primary/30"
                icon={<Folder className="w-4 h-4" />}
                onClick={() => navigate("/projects")}
              >
                Проекты
              </TelegramButton>
              <TelegramButton
                variant="outline"
                className="glass border-primary/30"
                icon={<Library className="w-4 h-4" />}
                onClick={() => navigate("/library")}
              >
                Библиотека
              </TelegramButton>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <TelegramButton
                variant="ghost"
                className="glass"
                icon={<Info className="w-4 h-4" />}
                onClick={() => navigate("/blog")}
              >
                О платформе
              </TelegramButton>
              <TelegramButton
                variant="ghost"
                className="glass"
                icon={<Settings className="w-4 h-4" />}
                onClick={() => navigate("/profile")}
              >
                Настройки
              </TelegramButton>
            </div>
          </div>
        </MessageBubble>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <MessageBubble className="p-4" status="info">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">AI</p>
                <p className="text-xs text-muted-foreground">Генерация</p>
              </div>
            </div>
          </MessageBubble>

          <MessageBubble className="p-4" status="success">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-muted-foreground">Доступно</p>
              </div>
            </div>
          </MessageBubble>
        </div>

        {/* Recent Tracks for Studio */}
        {recentTracks.length > 0 && (
          <MessageBubble title="Недавние треки" className="text-sm">
            <div className="space-y-2">
              {recentTracks.map(track => (
                <TelegramButton
                  key={track.id}
                  variant="ghost"
                  className="w-full justify-start glass h-auto py-2"
                  onClick={() => navigate(`/studio/${track.id}`)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {track.cover_url ? (
                      <img 
                        src={track.cover_url} 
                        alt="" 
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">{track.title || 'Без названия'}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.style || track.prompt}</p>
                    </div>
                    <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </TelegramButton>
              ))}
            </div>
          </MessageBubble>
        )}

        {/* Studio Features Info */}
        <MessageBubble title="Возможности студии" className="text-sm">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Разделение трека на стемы (вокал, ударные, бас, мелодия)</span>
            </li>
            <li className="flex items-start gap-2">
              <Scissors className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Замена секций трека (куплет, припев, бридж)</span>
            </li>
            <li className="flex items-start gap-2">
              <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Управление громкостью и эффектами каждого стема</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Экспорт микса в MP3 или WAV формате</span>
            </li>
          </ul>
        </MessageBubble>
      </div>
    </div>
  );
};

export default Studio;
