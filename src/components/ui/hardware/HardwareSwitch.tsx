/**
 * HardwareSwitch - Toggle switch with LED indicator
 * Styled like professional audio equipment toggles
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

export interface HardwareSwitchProps {
  on: boolean;
  onChange: (on: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'toggle' | 'rocker' | 'button';
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'primary';
  showLED?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 28, height: 16, toggle: 12 },
  md: { width: 36, height: 20, toggle: 16 },
  lg: { width: 44, height: 24, toggle: 20 },
};

const colorMap = {
  green: { active: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]' },
  red: { active: 'bg-red-500', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]' },
  yellow: { active: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]' },
  blue: { active: 'bg-blue-500', glow: 'shadow-[0_0_8px_rgba(96,165,250,0.6)]' },
  primary: { active: 'bg-primary', glow: 'shadow-glow-sm' },
};

export const HardwareSwitch = memo(function HardwareSwitch({
  on,
  onChange,
  label,
  labelPosition = 'right',
  size = 'md',
  variant = 'toggle',
  color = 'green',
  showLED = true,
  disabled = false,
  className,
}: HardwareSwitchProps) {
  const config = sizeConfig[size];
  const colors = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      onChange(!on);
    }
  };

  if (variant === 'button') {
    return (
      <ButtonSwitch
        on={on}
        onClick={handleClick}
        label={label}
        labelPosition={labelPosition}
        size={size}
        color={color}
        showLED={showLED}
        disabled={disabled}
        className={className}
      />
    );
  }

  if (variant === 'rocker') {
    return (
      <RockerSwitch
        on={on}
        onClick={handleClick}
        label={label}
        labelPosition={labelPosition}
        size={size}
        disabled={disabled}
        className={className}
      />
    );
  }

  // Toggle switch (default)
  const toggle = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative rounded-full transition-all duration-200',
        'bg-gradient-to-b from-zinc-700 to-zinc-900',
        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.1)]',
        'border border-zinc-600',
        disabled && 'opacity-50 cursor-not-allowed',
        on && colors.glow
      )}
      style={{ width: config.width, height: config.height }}
    >
      {/* Track active color */}
      <div 
        className={cn(
          'absolute inset-0.5 rounded-full transition-colors duration-200',
          on ? colors.active : 'bg-zinc-800'
        )}
      />
      
      {/* Toggle handle */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200',
          'bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500',
          'shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]',
          'border border-zinc-400'
        )}
        style={{
          width: config.toggle,
          height: config.toggle,
          left: on ? config.width - config.toggle - 2 : 2,
        }}
      >
        {/* Handle highlight */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
      </div>
    </button>
  );

  if (!label) {
    return <div className={className}>{toggle}</div>;
  }

  const containerClasses = cn(
    'flex items-center gap-2',
    labelPosition === 'top' && 'flex-col-reverse',
    labelPosition === 'bottom' && 'flex-col',
    labelPosition === 'left' && 'flex-row-reverse',
    className
  );

  return (
    <div className={containerClasses}>
      {toggle}
      <span className={cn(
        'text-[10px] font-medium uppercase tracking-wide',
        on ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  );
});

// Button-style switch
const ButtonSwitch = memo(function ButtonSwitch({
  on,
  onClick,
  label,
  labelPosition,
  size,
  color,
  showLED,
  disabled,
  className,
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
  labelPosition: 'left' | 'right' | 'top' | 'bottom';
  size: 'sm' | 'md' | 'lg';
  color: 'green' | 'red' | 'yellow' | 'blue' | 'primary';
  showLED: boolean;
  disabled: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-10 h-10 text-[10px]',
    lg: 'w-12 h-12 text-xs',
  };

  const colors = colorMap[color];

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-md font-medium uppercase tracking-wide transition-all',
        'bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800',
        'shadow-[0_3px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'border border-zinc-500',
        'active:translate-y-0.5 active:shadow-[0_1px_0_rgba(0,0,0,0.4)]',
        on && 'translate-y-0.5 shadow-[0_1px_0_rgba(0,0,0,0.4)]',
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size]
      )}
    >
      {/* LED indicator */}
      {showLED && (
        <div className={cn(
          'absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all',
          on 
            ? `${colors.active} shadow-[0_0_6px_currentColor]` 
            : 'bg-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
        )} />
      )}
      
      {label && (
        <span className={cn(
          'relative z-10',
          on ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </button>
  );

  if (!label || labelPosition === 'top' || labelPosition === 'bottom') {
    return <div className={className}>{button}</div>;
  }

  return button;
});

// Rocker-style switch
const RockerSwitch = memo(function RockerSwitch({
  on,
  onClick,
  label,
  labelPosition,
  size,
  disabled,
  className,
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
  labelPosition: 'left' | 'right' | 'top' | 'bottom';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-6 h-10',
    md: 'w-8 h-12',
    lg: 'w-10 h-14',
  };

  const rocker = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded transition-all overflow-hidden',
        'bg-gradient-to-b from-zinc-600 to-zinc-800',
        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]',
        'border border-zinc-500',
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size]
      )}
    >
      {/* Rocker element */}
      <div 
        className={cn(
          'absolute inset-0.5 rounded-sm transition-transform duration-150 origin-center',
          'bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-600',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
        )}
        style={{
          transform: on ? 'perspective(100px) rotateX(-10deg)' : 'perspective(100px) rotateX(10deg)',
        }}
      >
        {/* Labels */}
        <div className="absolute inset-x-0 top-1 text-center text-[8px] font-bold text-zinc-800">I</div>
        <div className="absolute inset-x-0 bottom-1 text-center text-[8px] font-bold text-zinc-300">O</div>
      </div>
    </button>
  );

  if (!label) {
    return <div className={className}>{rocker}</div>;
  }

  const containerClasses = cn(
    'flex items-center gap-2',
    labelPosition === 'top' && 'flex-col-reverse',
    labelPosition === 'bottom' && 'flex-col',
    labelPosition === 'left' && 'flex-row-reverse',
    className
  );

  return (
    <div className={containerClasses}>
      {rocker}
      <span className={cn(
        'text-[10px] font-medium uppercase tracking-wide',
        on ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  );
});

export default HardwareSwitch;
