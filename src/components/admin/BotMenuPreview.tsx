/**
 * Bot Menu Preview Component
 * Simulates how the menu looks in Telegram
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ExternalLink, Smartphone } from 'lucide-react';
import type { BotMenuItem } from '@/hooks/useBotMenuItems';

interface BotMenuPreviewProps {
  items: BotMenuItem[];
}

export function BotMenuPreview({ items }: BotMenuPreviewProps) {
  const [currentMenu, setCurrentMenu] = useState<string>('main');
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  
  // Get current menu item
  const currentMenuItem = useMemo(() => {
    return items.find(i => i.menu_key === currentMenu);
  }, [items, currentMenu]);
  
  // Get items for current menu
  const currentItems = useMemo(() => {
    return items
      .filter(i => i.parent_key === currentMenu && i.is_enabled && i.show_in_menu)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [items, currentMenu]);
  
  // Group items by row
  const rows = useMemo(() => {
    const rowMap = new Map<number, BotMenuItem[]>();
    
    for (const item of currentItems) {
      const row = item.row_position;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(item);
    }
    
    return [...rowMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, items]) => items);
  }, [currentItems]);
  
  const handleButtonClick = (item: BotMenuItem) => {
    if (item.action_type === 'submenu') {
      setNavigationStack(prev => [...prev, currentMenu]);
      setCurrentMenu(item.menu_key);
    }
  };
  
  const handleBack = () => {
    if (navigationStack.length > 0) {
      const prev = navigationStack[navigationStack.length - 1];
      setNavigationStack(s => s.slice(0, -1));
      setCurrentMenu(prev);
    } else {
      setCurrentMenu('main');
    }
  };
  
  const getImage = () => {
    if (currentMenuItem?.image_url) return currentMenuItem.image_url;
    if (currentMenuItem?.image_fallback) return currentMenuItem.image_fallback;
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80';
  };
  
  const getCaption = () => {
    if (currentMenuItem?.caption) return currentMenuItem.caption;
    if (currentMenu === 'main') {
      return '*Добро пожаловать в MusicVerse\\!*\n\n💰 100 кредитов \\| Ур\\. 5\n\n🎵 12 треков \\| ❤️ 45 \\| ▶️ 230\n\n👇 *Выберите действие:*';
    }
    return `*${currentMenuItem?.title || 'Меню'}*\n\n${currentMenuItem?.description || 'Выберите действие'}`;
  };
  
  // Simple MarkdownV2 to HTML conversion
  const renderCaption = (text: string) => {
    return text
      .replace(/\\\!/g, '!')
      .replace(/\\\./g, '.')
      .replace(/\\\|/g, '|')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Smartphone className="h-4 w-4" />
        Симуляция интерфейса Telegram
      </div>
      
      {/* Phone frame */}
      <div className="relative w-[360px] bg-[#1a1a2e] rounded-[32px] p-3 shadow-xl">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
        
        {/* Screen */}
        <div className="bg-[#0f0f1a] rounded-[24px] overflow-hidden mt-6">
          {/* Chat header */}
          <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">MusicVerse Bot</div>
              <div className="text-xs text-gray-400">бот</div>
            </div>
          </div>
          
          {/* Message area */}
          <div className="p-3 min-h-[400px] flex flex-col justify-end">
            {/* Bot message with photo */}
            <div className="max-w-[280px]">
              {/* Image */}
              <div className="rounded-t-xl overflow-hidden">
                <img
                  src={getImage()}
                  alt="Menu"
                  className="w-full h-40 object-cover"
                />
              </div>
              
              {/* Caption */}
              <div 
                className="bg-[#2a2a4a] px-3 py-2 text-sm text-white"
                dangerouslySetInnerHTML={{ __html: renderCaption(getCaption()) }}
              />
              
              {/* Buttons */}
              <div className="bg-[#2a2a4a] rounded-b-xl overflow-hidden">
                {rows.map((rowItems, rowIndex) => (
                  <div key={rowIndex} className="flex border-t border-[#1a1a2e]">
                    {rowItems.map((item, itemIndex) => (
                      <button
                        key={item.id}
                        className={`
                          flex-1 py-2.5 px-2 text-center text-sm text-blue-400 
                          hover:bg-[#3a3a5a] transition-colors
                          ${itemIndex > 0 ? 'border-l border-[#1a1a2e]' : ''}
                        `}
                        style={{ flexBasis: `${(item.column_span / 2) * 100}%` }}
                        onClick={() => handleButtonClick(item)}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {item.icon_emoji && <span>{item.icon_emoji}</span>}
                          <span className="truncate">{item.title}</span>
                          {item.action_type === 'webapp' && (
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
                
                {/* Back button for submenus */}
                {currentMenu !== 'main' && (
                  <div className="flex border-t border-[#1a1a2e]">
                    <button
                      className="flex-1 py-2.5 px-2 text-center text-sm text-blue-400 hover:bg-[#3a3a5a] transition-colors"
                      onClick={handleBack}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <ChevronLeft className="h-4 w-4" />
                        Назад
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Input area */}
          <div className="bg-[#1a1a2e] px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-[#2a2a4a] rounded-full px-4 py-2 text-sm text-gray-400">
              Сообщение
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation info */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {currentMenu === 'main' ? '🏠 Главное меню' : (
            <>
              {currentMenuItem?.icon_emoji} {currentMenuItem?.title}
            </>
          )}
        </Badge>
        {navigationStack.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
        )}
      </div>
    </div>
  );
}
