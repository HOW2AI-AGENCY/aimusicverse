import { useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { TelegramButton } from "@/components/TelegramButton";
import { useNavigate } from "react-router-dom";
import { Music, Library, Folder, Settings, Info, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

const Studio = () => {
  const navigate = useNavigate();

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
              ОТКРЫТЬ СТУДИЮ
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

        {/* Info Section */}
        <MessageBubble title="Возможности" className="text-sm">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Генерация музыки по текстовым промптам</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Управление проектами и треками</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Встроенный плеер с визуализацией</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Разделение треков на стемы (Voice, Bass, Drums)</span>
            </li>
          </ul>
        </MessageBubble>
      </div>
    </div>
  );
};

export default Studio;
