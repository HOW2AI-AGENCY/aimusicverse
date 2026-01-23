/**
 * MobilePageTransition - Smooth page transitions for mobile
 * OPTIMIZED: Uses CSS animations for native-feeling performance
 */

import { memo, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobilePageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const MobilePageTransition = memo(function MobilePageTransition({
  children,
  className,
}: MobilePageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    // Reset and trigger animation on route change
    setIsVisible(false);
    setKey(location.pathname);
    
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  return (
    <div
      key={key}
      className={cn(
        "mobile-page-transition",
        isVisible && "mobile-page-visible",
        className
      )}
    >
      {children}
    </div>
  );
});

// Simpler fade transition for overlays/modals
interface MobileFadeTransitionProps {
  children: ReactNode;
  className?: string;
  isVisible: boolean;
}

export const MobileFadeTransition = memo(function MobileFadeTransition({
  children,
  className,
  isVisible,
}: MobileFadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "mobile-fade-transition",
        animating && "mobile-fade-visible",
        className
      )}
    >
      {children}
    </div>
  );
});

// Slide up transition for bottom sheets
interface MobileSlideUpTransitionProps {
  children: ReactNode;
  className?: string;
  isVisible: boolean;
}

export const MobileSlideUpTransition = memo(function MobileSlideUpTransition({
  children,
  className,
  isVisible,
}: MobileSlideUpTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "mobile-slide-up-transition",
        animating && "mobile-slide-visible",
        className
      )}
    >
      {children}
    </div>
  );
});
