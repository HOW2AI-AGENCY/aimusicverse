/**
 * VUMeter - Analog-style volume meter
 * Supports needle, LED bar, and digital display modes
 */

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface VUMeterProps {
  value: number; // 0 to 1, where 1 = 0dB
  peak?: number; // Peak hold value
  type?: 'needle' | 'led' | 'digital' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  showDb?: boolean;
  stereo?: boolean;
  leftValue?: number;
  rightValue?: number;
  className?: string;
}

const dbScale = [-48, -36, -24, -18, -12, -9, -6, -3, 0, 3];

// Convert linear 0-1 to dB
const toDB = (value: number): number => {
  if (value <= 0) return -Infinity;
  return 20 * Math.log10(value);
};

const sizeConfig = {
  xs: { height: 60, width: 8, ledSize: 3, gap: 1 },
  sm: { height: 80, width: 12, ledSize: 4, gap: 1 },
  md: { height: 120, width: 16, ledSize: 5, gap: 2 },
  lg: { height: 160, width: 20, ledSize: 6, gap: 2 },
};

export const VUMeter = memo(function VUMeter({
  value,
  peak,
  type = 'led',
  size = 'md',
  label,
  showDb = true,
  stereo = false,
  leftValue,
  rightValue,
  className,
}: VUMeterProps) {
  const config = sizeConfig[size];
  const db = toDB(value);

  if (type === 'needle') {
    return <NeedleMeter value={value} peak={peak} label={label} className={className} />;
  }

  if (type === 'digital') {
    return <DigitalMeter value={value} label={label} showDb={showDb} className={className} />;
  }

  if (stereo && leftValue !== undefined && rightValue !== undefined) {
    return (
      <div className={cn('flex gap-1 items-end', className)}>
        <LEDBar value={leftValue} config={config} label="L" />
        <LEDBar value={rightValue} config={config} label="R" />
      </div>
    );
  }

  if (type === 'horizontal') {
    return <HorizontalMeter value={value} peak={peak} label={label} showDb={showDb} className={className} />;
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && <span className="text-[9px] text-muted-foreground font-medium">{label}</span>}
      <LEDBar value={value} peak={peak} config={config} />
      {showDb && (
        <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
          {db > -60 ? `${db.toFixed(0)}dB` : '-∞'}
        </span>
      )}
    </div>
  );
});

// LED Bar component
const LEDBar = memo(function LEDBar({ 
  value, 
  peak, 
  config,
  label 
}: { 
  value: number; 
  peak?: number;
  config: typeof sizeConfig.md;
  label?: string;
}) {
  const ledCount = Math.floor(config.height / (config.ledSize + config.gap));
  
  const leds = useMemo(() => 
    Array.from({ length: ledCount }, (_, i) => {
      const ledValue = (ledCount - i) / ledCount;
      const isActive = value >= ledValue - 0.02;
      const isPeak = peak !== undefined && Math.abs(peak - ledValue) < 0.05;
      
      // Color zones: green (0-70%), yellow (70-90%), red (90-100%)
      const isRed = ledValue > 0.9;
      const isYellow = ledValue > 0.7 && ledValue <= 0.9;
      
      return { isActive, isPeak, isRed, isYellow };
    }), [ledCount, value, peak]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <span className="text-[8px] text-muted-foreground">{label}</span>}
      <div 
        className="flex flex-col rounded-sm overflow-hidden bg-black/40 p-0.5"
        style={{ gap: config.gap }}
      >
        {leds.map((led, i) => (
          <div
            key={i}
            className={cn(
              'rounded-[1px] transition-all duration-75',
              led.isActive || led.isPeak ? (
                led.isRed ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.7)]' :
                led.isYellow ? 'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]' :
                'bg-emerald-400 shadow-[0_0_3px_rgba(52,211,153,0.5)]'
              ) : 'bg-zinc-800'
            )}
            style={{ 
              width: config.width, 
              height: config.ledSize,
              opacity: led.isActive ? 1 : led.isPeak ? 0.8 : 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
});

// Needle meter component
const NeedleMeter = memo(function NeedleMeter({
  value,
  peak,
  label,
  className,
}: {
  value: number;
  peak?: number;
  label?: string;
  className?: string;
}) {
  // Map 0-1 to -45deg to +45deg
  const rotation = -45 + value * 90;
  const peakRotation = peak ? -45 + peak * 90 : undefined;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
      
      <div className="relative w-24 h-14 bg-gradient-to-b from-amber-50 to-amber-100 rounded-t-full overflow-hidden border border-amber-200 shadow-inner">
        {/* VU scale markings */}
        <svg className="absolute inset-0" viewBox="0 0 96 56">
          {/* Scale arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 86 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-amber-900/50"
          />
          {/* Scale ticks */}
          {[-3, -2, -1, 0, 1, 2, 3].map((tick, i) => {
            const angle = (-45 + (i / 6) * 90) * (Math.PI / 180);
            const x1 = 48 + Math.cos(angle - Math.PI / 2) * 32;
            const y1 = 50 + Math.sin(angle - Math.PI / 2) * 32;
            const x2 = 48 + Math.cos(angle - Math.PI / 2) * 38;
            const y2 = 50 + Math.sin(angle - Math.PI / 2) * 38;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor"
                strokeWidth={tick === 0 ? 1.5 : 0.75}
                className={tick >= 2 ? 'text-red-600' : 'text-amber-900'}
              />
            );
          })}
          {/* VU text */}
          <text x="48" y="44" textAnchor="middle" className="text-[8px] fill-amber-900/70 font-semibold">
            VU
          </text>
        </svg>

        {/* Peak indicator */}
        {peakRotation !== undefined && (
          <div
            className="absolute bottom-0 left-1/2 origin-bottom w-px h-9 bg-red-500/50"
            style={{ transform: `translateX(-50%) rotate(${peakRotation}deg)` }}
          />
        )}

        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-100"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="w-0.5 h-10 bg-gradient-to-t from-red-600 via-red-500 to-red-400 rounded-t-full shadow-md" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  );
});

// Digital meter component  
const DigitalMeter = memo(function DigitalMeter({
  value,
  label,
  showDb,
  className,
}: {
  value: number;
  label?: string;
  showDb?: boolean;
  className?: string;
}) {
  const db = toDB(value);
  const displayDb = db > -60 ? db.toFixed(1) : '-∞';
  const percentage = Math.round(value * 100);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && <span className="text-[9px] text-muted-foreground font-medium">{label}</span>}
      
      <div className="px-2 py-1 rounded bg-black border border-zinc-700 font-mono">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          value > 0.9 ? 'text-red-400' : value > 0.7 ? 'text-yellow-400' : 'text-emerald-400'
        )}>
          {showDb ? `${displayDb}dB` : `${percentage}%`}
        </span>
      </div>
    </div>
  );
});

// Horizontal meter for inline display
const HorizontalMeter = memo(function HorizontalMeter({
  value,
  peak,
  label,
  showDb,
  className,
}: {
  value: number;
  peak?: number;
  label?: string;
  showDb?: boolean;
  className?: string;
}) {
  const db = toDB(value);
  const segments = 20;
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-[9px] text-muted-foreground font-medium w-4">{label}</span>}
      
      <div className="flex-1 flex gap-px h-3 bg-black/30 rounded-sm p-0.5">
        {Array.from({ length: segments }, (_, i) => {
          const segmentValue = (i + 1) / segments;
          const isActive = value >= segmentValue - 0.02;
          const isPeak = peak !== undefined && Math.abs(peak - segmentValue) < 0.03;
          const isRed = segmentValue > 0.9;
          const isYellow = segmentValue > 0.7 && segmentValue <= 0.9;
          
          return (
            <div
              key={i}
              className={cn(
                'flex-1 h-full rounded-[1px] transition-colors duration-75',
                isActive || isPeak ? (
                  isRed ? 'bg-red-500' :
                  isYellow ? 'bg-yellow-400' :
                  'bg-emerald-400'
                ) : 'bg-zinc-800/50'
              )}
            />
          );
        })}
      </div>
      
      {showDb && (
        <span className="text-[9px] font-mono text-muted-foreground tabular-nums w-10 text-right">
          {db > -60 ? `${db.toFixed(0)}dB` : '-∞'}
        </span>
      )}
    </div>
  );
});

export default VUMeter;
