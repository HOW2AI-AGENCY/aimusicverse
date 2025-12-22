/**
 * Settings Sidebar - Vertical navigation for settings on desktop
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Palette, 
  Shield, 
  Bell, 
  Lightbulb, 
  Music, 
  Send 
} from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const settingsTabs = [
  { id: 'profile', label: 'Профиль', icon: User, description: 'Личные данные и аватар' },
  { id: 'appearance', label: 'Тема', icon: Palette, description: 'Внешний вид приложения' },
  { id: 'privacy', label: 'Приватность', icon: Shield, description: 'Настройки доступа' },
  { id: 'notifications', label: 'Уведомления', icon: Bell, description: 'Каналы и типы уведомлений' },
  { id: 'hints', label: 'Подсказки', icon: Lightbulb, description: 'Обучающие подсказки' },
  { id: 'midi', label: 'MIDI', icon: Music, description: 'Настройки MIDI-устройств' },
  { id: 'telegram', label: 'Telegram', icon: Send, description: 'Интеграция с Telegram' },
];

export function SettingsSidebar({ activeTab, onTabChange, className }: SettingsSidebarProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {settingsTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start h-auto py-3 px-3",
              isActive && "bg-primary/10 border-l-2 border-primary rounded-l-none"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className={cn(
              "w-5 h-5 mr-3 flex-shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex-1 text-left">
              <div className={cn(
                "text-sm font-medium",
                isActive && "text-primary"
              )}>
                {tab.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tab.description}
              </div>
            </div>
          </Button>
        );
      })}
    </nav>
  );
}