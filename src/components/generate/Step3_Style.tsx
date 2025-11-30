import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step3StyleProps {
  onNext: (data: { style: { genres: string[]; moods: string[] } }) => void;
  onBack: () => void;
}

const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Lo-fi'];
const moods = ['Happy', 'Sad', 'Energetic', 'Chill', 'Dark', 'Romantic'];

export const Step3Style = ({ onNext, onBack }: Step3StyleProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleNext = () => {
    onNext({ style: { genres: selectedGenres, moods: selectedMoods } });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Выберите стиль</h2>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Жанр</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <Button
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                onClick={() => handleGenreSelect(genre)}
              >
                {genre}
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Настроение</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {moods.map(mood => (
              <Button
                key={mood}
                variant={selectedMoods.includes(mood) ? "default" : "outline"}
                onClick={() => handleMoodSelect(mood)}
              >
                {mood}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Назад</Button>
        <Button onClick={handleNext}>Далее</Button>
      </div>
    </div>
  );
};
