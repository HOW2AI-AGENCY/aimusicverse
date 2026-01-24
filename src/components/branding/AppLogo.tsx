/**
 * AppLogo - Unified logo component for consistent branding
 * Single source of truth for logo across the app
 */

import { memo, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
export type LogoVariant = 'default' | 'glow' | 'minimal';

interface AppLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  showName?: boolean;
  showTagline?: boolean;
  className?: string;
  style?: CSSProperties;
}

const sizeMap: Record<LogoSize, { logo: string; text: string; tagline: string }> = {
  xs: { logo: 'w-6 h-6', text: 'text-[10px]', tagline: 'text-[8px]' },
  sm: { logo: 'w-8 h-8', text: 'text-xs', tagline: 'text-[10px]' },
  md: { logo: 'w-10 h-10', text: 'text-sm', tagline: 'text-xs' },
  lg: { logo: 'w-16 h-16', text: 'text-lg', tagline: 'text-sm' },
  xl: { logo: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-2xl sm:text-3xl', tagline: 'text-sm' },
  hero: { logo: 'w-24 h-24', text: 'text-3xl', tagline: 'text-base' },
};

const variantStyles: Record<LogoVariant, string> = {
  default: 'rounded-xl shadow-md',
  glow: 'rounded-2xl shadow-xl ring-1 ring-primary/20',
  minimal: 'rounded-lg',
};

/**
 * Unified App Logo with consistent sizing and styling
 */
export const AppLogo = memo(function AppLogo({
  size = 'md',
  variant = 'default',
  showName = false,
  showTagline = false,
  className,
  style,
}: AppLogoProps) {
  const sizes = sizeMap[size];
  
  return (
    <div 
      className={cn('flex flex-col items-center', className)}
      style={style}
    >
      {/* Logo container with optional glow */}
      <div className={cn(
        'relative',
        variant === 'glow' && 'p-3 bg-card/80 backdrop-blur-sm border border-primary/20'
      )}>
        {/* Glow effect */}
        {variant === 'glow' && (
          <div 
            className="absolute -inset-4 rounded-3xl bg-primary/25 blur-xl"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
            aria-hidden="true"
          />
        )}
        
        <img 
          src={logo}
          alt="MusicVerse AI"
          className={cn(sizes.logo, variantStyles[variant], 'relative z-10')}
          loading="eager"
          decoding="async"
        />
      </div>
      
      {/* App name */}
      {showName && (
        <h1 className={cn(
          sizes.text,
          'font-bold text-gradient leading-tight mt-1'
        )}>
          MusicVerse AI
        </h1>
      )}
      
      {/* Tagline */}
      {showTagline && (
        <p className={cn(sizes.tagline, 'text-muted-foreground')}>
          Генерация музыки с AI
        </p>
      )}
    </div>
  );
});

/**
 * Logo with animated glow for splash screens
 */
export const AnimatedLogo = memo(function AnimatedLogo({
  size = 'xl',
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  const sizes = sizeMap[size];
  
  return (
    <div className={cn('relative', className)}>
      {/* Animated glow */}
      <div 
        className="absolute -inset-4 rounded-3xl bg-primary/25 blur-xl"
        style={{ animation: 'pulse 2s ease-in-out infinite' }}
        aria-hidden="true"
      />
      
      {/* Logo container */}
      <div className="relative p-3 rounded-3xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-xl">
        <img 
          src={logo}
          alt="MusicVerse AI"
          className={cn(sizes.logo, 'rounded-2xl')}
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
});

export default AppLogo;
