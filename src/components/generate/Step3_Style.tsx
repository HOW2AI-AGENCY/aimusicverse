import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step3StyleProps {
  onNext: (data: { style: { genres: string[]; moods: string[] } }) => void;
  onBack: () => void;
}

const genres = ["Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Lo-fi"];
const moods = ["Happy", "Sad", "Energetic", "Chill", "Dark", "Romantic"];

export const Step3Style = ({ onNext, onBack }: Step3StyleProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  };

  const handleNext = () => {
    onNext({ style: { genres: selectedGenres, moods: selectedMoods } });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
          Выберите стиль
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Выберите жанры и настроение для вашего трека</p>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Жанр</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-3 sm:p-6 pt-0">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                onClick={() => handleGenreSelect(genre)}
                className={cn(
                  "min-h-[44px] touch-manipulation active:scale-95 transition-transform",
                  selectedGenres.includes(genre) && "shadow-md shadow-primary/30"
                )}
                size="lg"
              >
                {genre}
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Настроение</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-3 sm:p-6 pt-0">
            {moods.map((mood) => (
              <Button
                key={mood}
                variant={selectedMoods.includes(mood) ? "default" : "outline"}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "min-h-[44px] touch-manipulation active:scale-95 transition-transform",
                  selectedMoods.includes(mood) && "shadow-md shadow-primary/30"
                )}
                size="lg"
              >
                {mood}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between pt-3 sm:pt-4 border-t border-border/50 gap-3">
        <Button 
          variant="outline" 
          onClick={onBack}
          size="lg"
          className="flex-1 sm:flex-initial min-h-[48px] touch-manipulation active:scale-95 transition-transform"
        >
          Назад
        </Button>
        <Button 
          onClick={handleNext}
          size="lg"
          className="flex-1 sm:flex-initial min-h-[48px] touch-manipulation active:scale-95 transition-transform"
        >
          Далее
        </Button>
      </div>
    </div>
  );
};
