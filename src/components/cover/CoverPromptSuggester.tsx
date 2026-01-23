/**
 * CoverPromptSuggester - Rotating branded prompt suggestions for cover generation
 * Shows MusicVerse-branded prompts every 5-8 seconds
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CoverPromptSuggesterProps {
  onSelectPrompt?: (prompt: string) => void;
  genre?: string;
  mood?: string;
  className?: string;
  autoRotate?: boolean;
  rotationInterval?: number; // ms
}

// MusicVerse branded prompt templates
const BRANDED_PROMPTS = [
  // Abstract & Cosmic
  {
    template: "MusicVerse aesthetic: abstract sound waves flowing through {color} gradient space",
    colors: ["purple-blue", "neon cyan-magenta", "golden-amber", "emerald-teal"],
  },
  {
    template: "MusicVerse style: cosmic vinyl record floating in {scene}",
    scene: ["deep space with nebula clouds", "aurora borealis", "sunset horizon", "underwater bioluminescence"],
  },
  {
    template: "MusicVerse signature: {element} with MV purple-blue color accents",
    element: ["geometric crystal formations", "flowing liquid metal", "exploding star particles", "digital soundwave patterns"],
  },
  // Genre-specific
  {
    template: "MusicVerse {genre}: {visual} in futuristic neon palette",
    genre: ["electronic", "ambient", "synthwave", "future bass"],
    visual: ["cityscape at night", "holographic DJ deck", "data stream visualization", "retro-futuristic car"],
  },
  {
    template: "MusicVerse {genre}: {visual} with dramatic lighting",
    genre: ["rock", "metal", "alternative", "punk"],
    visual: ["electric guitar engulfed in flames", "shattered glass explosion", "lightning strike on stage", "abstract smoke and fire"],
  },
  {
    template: "MusicVerse {genre}: {visual} with warm golden tones",
    genre: ["jazz", "soul", "R&B", "blues"],
    visual: ["saxophone silhouette in smoke", "vintage microphone close-up", "piano keys reflection", "intimate club atmosphere"],
  },
  // Artistic styles
  {
    template: "MusicVerse art: {style} interpretation of music and emotion",
    style: ["surrealist", "neo-expressionist", "abstract minimalist", "cyberpunk collage"],
  },
  {
    template: "MusicVerse vision: {subject} rendered in {technique}",
    subject: ["human face merging with soundwaves", "headphones transforming to butterflies", "heart made of musical notes"],
    technique: ["iridescent 3D render", "glitch art distortion", "watercolor dream style", "photorealistic detail"],
  },
];

// Generate a random prompt from templates
function generateRandomPrompt(genre?: string, mood?: string): string {
  const template = BRANDED_PROMPTS[Math.floor(Math.random() * BRANDED_PROMPTS.length)];
  let prompt = template.template;
  
  // Replace placeholders
  Object.entries(template).forEach(([key, value]) => {
    if (key !== 'template' && Array.isArray(value)) {
      const placeholder = `{${key}}`;
      if (prompt.includes(placeholder)) {
        // Use genre/mood if matching, otherwise random
        if (key === 'genre' && genre && value.some(v => genre.toLowerCase().includes(v.toLowerCase()))) {
          prompt = prompt.replace(placeholder, genre);
        } else {
          prompt = prompt.replace(placeholder, value[Math.floor(Math.random() * value.length)]);
        }
      }
    }
  });
  
  // Add mood if available
  if (mood && !prompt.toLowerCase().includes(mood.toLowerCase())) {
    prompt += `, ${mood} mood`;
  }
  
  return prompt;
}

export function CoverPromptSuggester({
  onSelectPrompt,
  genre,
  mood,
  className,
  autoRotate = true,
  rotationInterval = 6000, // 6 seconds
}: CoverPromptSuggesterProps) {
  const [currentPrompt, setCurrentPrompt] = useState(() => generateRandomPrompt(genre, mood));
  const [key, setKey] = useState(0);

  const rotatePrompt = useCallback(() => {
    setCurrentPrompt(generateRandomPrompt(genre, mood));
    setKey(k => k + 1);
  }, [genre, mood]);

  // Auto-rotate prompts
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(rotatePrompt, rotationInterval);
    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, rotatePrompt]);

  const handleSelect = () => {
    onSelectPrompt?.(currentPrompt);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3 text-primary" />
        <span>Идея для обложки</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-auto"
          onClick={rotatePrompt}
          aria-label="Следующая идея"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.button
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          onClick={handleSelect}
          className={cn(
            "w-full text-left p-3 rounded-lg",
            "bg-gradient-to-r from-primary/10 to-primary/5",
            "border border-primary/20 hover:border-primary/40",
            "transition-colors cursor-pointer",
            "text-sm text-foreground/80 leading-relaxed"
          )}
        >
          <span className="text-primary font-medium">MusicVerse</span>
          {currentPrompt.replace(/^MusicVerse\s*/i, '')}
        </motion.button>
      </AnimatePresence>
      
      <p className="text-[10px] text-muted-foreground text-center">
        Нажмите, чтобы использовать этот промпт
      </p>
    </div>
  );
}

export default CoverPromptSuggester;
