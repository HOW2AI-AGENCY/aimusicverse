/**
 * ArtistDetailPreview - Desktop preview panel for selected artist
 * Shows avatar, bio, genres, and quick actions
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Sparkles, Music2, Mic2, Play, 
  ExternalLink, Edit2, Trash2, Globe 
} from 'lucide-react';
import type { Artist } from '@/hooks/useArtists';
import { cn } from '@/lib/utils';
import { ProBadge } from '@/components/ui/pro-badge';

interface ArtistDetailPreviewProps {
  artist: Artist;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onGenerate?: () => void;
}

export const ArtistDetailPreview = memo(function ArtistDetailPreview({
  artist,
  isOwner = false,
  onEdit,
  onDelete,
  onGenerate,
}: ArtistDetailPreviewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Artist Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-xl">
              {artist.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {artist.is_ai_generated && (
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary shadow-md">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold truncate">{artist.name}</h2>
            {artist.is_ai_generated && <ProBadge size="sm" />}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {artist.is_public ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Globe className="w-3 h-3" />
                Публичный
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Users className="w-3 h-3" />
                Личный
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bio */}
      {artist.bio && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {artist.bio}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Style Description */}
      {artist.style_description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-primary" />
            Стиль
          </h3>
          <p className="text-sm text-muted-foreground">
            {artist.style_description}
          </p>
        </motion.div>
      )}

      {/* Genre Tags */}
      {artist.genre_tags && artist.genre_tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Music2 className="w-4 h-4 text-primary" />
            Жанры
          </h3>
          <div className="flex flex-wrap gap-2">
            {artist.genre_tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="bg-primary/10 text-primary border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mood Tags */}
      {artist.mood_tags && artist.mood_tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-sm font-medium mb-2">Настроение</h3>
          <div className="flex flex-wrap gap-2">
            {artist.mood_tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="outline"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-4 space-y-2"
      >
        {onGenerate && (
          <Button
            onClick={onGenerate}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Генерировать с этим артистом
          </Button>
        )}
        
        {isOwner && (
          <div className="grid grid-cols-2 gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={onDelete}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
});

export default ArtistDetailPreview;
