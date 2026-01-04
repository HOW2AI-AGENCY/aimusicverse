import { motion } from '@/lib/motion';
import { FileText, Music, Mic2, Headphones } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ProfileSetupData } from './EnhancedProfileSetup';

interface ProfileSetupStep2AboutProps {
  data: ProfileSetupData;
  onUpdate: (updates: Partial<ProfileSetupData>) => void;
}

const ROLES = [
  { id: 'producer', label: 'Продюсер', icon: Music, description: 'Создаю музыку' },
  { id: 'musician', label: 'Музыкант', icon: Mic2, description: 'Играю / пою' },
  { id: 'listener', label: 'Слушатель', icon: Headphones, description: 'Слушаю музыку' },
] as const;

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Jazz',
  'Classical', 'Metal', 'Folk', 'Latin', 'Indie', 'Ambient'
];

export function ProfileSetupStep2About({ data, onUpdate }: ProfileSetupStep2AboutProps) {
  const toggleGenre = (genre: string) => {
    const newGenres = data.genres.includes(genre)
      ? data.genres.filter(g => g !== genre)
      : [...data.genres, genre].slice(0, 5); // Max 5 genres
    onUpdate({ genres: newGenres });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          О себе
        </Label>
        <Textarea
          id="bio"
          value={data.bio}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          placeholder="Расскажите немного о себе, своей музыке, интересах..."
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {data.bio.length}/500
        </p>
      </div>

      {/* Role */}
      <div className="space-y-3">
        <Label>Кто вы?</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = data.role === role.id;
            return (
              <button
                key={role.id}
                onClick={() => onUpdate({ role: role.id as ProfileSetupData['role'] })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-center",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mx-auto mb-1",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium block",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Genres */}
      <div className="space-y-3">
        <Label>Любимые жанры (до 5)</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => {
            const isSelected = data.genres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
