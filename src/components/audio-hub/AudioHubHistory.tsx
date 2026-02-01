/**
 * AudioHubHistory - Recent recordings and uploads history
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Mic, Upload, Play, MoreVertical, 
  Trash2, Download, Share2, Sparkles, FileAudio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

interface HistoryItem {
  id: string;
  type: 'recording' | 'upload';
  name: string;
  duration: number;
  createdAt: Date;
  analysis?: {
    bpm?: number;
    key?: string;
    genre?: string;
  };
}

// Mock data - in real app would come from database
const mockHistory: HistoryItem[] = [
  {
    id: '1',
    type: 'recording',
    name: 'Вокальная запись',
    duration: 127,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    analysis: { bpm: 120, key: 'Am', genre: 'Pop' }
  },
  {
    id: '2',
    type: 'upload',
    name: 'guitar_riff.wav',
    duration: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    analysis: { bpm: 140, key: 'E', genre: 'Rock' }
  },
  {
    id: '3',
    type: 'recording',
    name: 'Гитарная партия',
    duration: 89,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    analysis: { bpm: 95, key: 'G', genre: 'Acoustic' }
  },
  {
    id: '4',
    type: 'upload',
    name: 'demo_beat.mp3',
    duration: 180,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export const AudioHubHistory = memo(function AudioHubHistory() {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupedHistory = useMemo(() => {
    const today: HistoryItem[] = [];
    const yesterday: HistoryItem[] = [];
    const older: HistoryItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    mockHistory.forEach(item => {
      if (item.createdAt >= todayStart) {
        today.push(item);
      } else if (item.createdAt >= yesterdayStart) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, older };
  }, []);

  const renderItem = (item: HistoryItem, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      {/* Icon */}
      <div className={cn(
        'p-2 rounded-lg shrink-0',
        item.type === 'recording' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary-foreground'
      )}>
        {item.type === 'recording' ? (
          <Mic className="h-4 w-4" />
        ) : (
          <FileAudio className="h-4 w-4" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDuration(item.duration)}</span>
          {item.analysis && (
            <>
              <span>•</span>
              <span>{item.analysis.bpm} BPM</span>
              <span>•</span>
              <span>{item.analysis.key}</span>
            </>
          )}
        </div>
      </div>

      {/* Analysis badge */}
      {item.analysis?.genre && (
        <Badge variant="outline" className="hidden sm:flex">
          {item.analysis.genre}
        </Badge>
      )}

      {/* Play button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
      >
        <Play className="h-4 w-4" />
      </Button>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Sparkles className="h-4 w-4 mr-2" />
            Анализировать
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4 mr-2" />
            Скачать
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4 mr-2" />
            Поделиться
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );

  const renderSection = (title: string, items: HistoryItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">
          {title}
        </h3>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  };

  const hasHistory = mockHistory.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          История
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasHistory ? (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-6">
              {renderSection('Сегодня', groupedHistory.today)}
              {renderSection('Вчера', groupedHistory.yesterday)}
              {renderSection('Ранее', groupedHistory.older)}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">Пока пусто</p>
            <p className="text-sm">
              Записи и загрузки появятся здесь
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default AudioHubHistory;
