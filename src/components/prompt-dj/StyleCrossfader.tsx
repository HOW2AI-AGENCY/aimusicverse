import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface StyleCrossfaderProps {
  position: number; // -1 to 1
  onChange: (position: number) => void;
  disabled?: boolean;
}

export function StyleCrossfader({ position, onChange, disabled }: StyleCrossfaderProps) {
  // Convert from -1...1 to 0...100 for slider
  const sliderValue = ((position + 1) / 2) * 100;
  
  const handleChange = (values: number[]) => {
    // Convert back from 0...100 to -1...1
    const newPosition = (values[0] / 100) * 2 - 1;
    onChange(newPosition);
  };

  const handleDoubleClick = () => {
    onChange(0); // Reset to center
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className={cn(
          'px-3 py-1 rounded-full transition-colors',
          position < 0 ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground'
        )}>
          A
        </span>
        <span className="text-xs text-muted-foreground">Crossfader</span>
        <span className={cn(
          'px-3 py-1 rounded-full transition-colors',
          position > 0 ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground'
        )}>
          B
        </span>
      </div>
      
      <div 
        className="relative py-2"
        onDoubleClick={handleDoubleClick}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-purple-500/30 via-muted to-blue-500/30" />
        
        {/* Center marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-muted-foreground/50 rounded-full" />
        
        <Slider
          value={[sliderValue]}
          onValueChange={handleChange}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          className="relative z-10"
        />
      </div>

      {/* Position indicator */}
      <div className="text-center text-xs text-muted-foreground">
        {position === 0 ? 'Центр' : 
         position < 0 ? `A: ${Math.round(Math.abs(position) * 100)}%` :
         `B: ${Math.round(position * 100)}%`}
      </div>
    </div>
  );
}
