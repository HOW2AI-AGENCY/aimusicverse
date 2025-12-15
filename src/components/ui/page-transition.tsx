import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = React.useState(false);
  const [displayChildren, setDisplayChildren] = React.useState(children);

  React.useEffect(() => {
    setIsVisible(false);
    
    // Small delay for exit animation
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        className
      )}
    >
      {displayChildren}
    </div>
  );
};

// Simple fade transition without location dependency
interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  unmountOnExit?: boolean;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  className,
  duration = 200,
  unmountOnExit = true,
}) => {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else if (unmountOnExit) {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, unmountOnExit]);

  if (!shouldRender && unmountOnExit) return null;

  return (
    <div
      className={cn(
        "transition-opacity",
        show ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Scale fade transition
interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  origin?: "center" | "top" | "bottom" | "left" | "right";
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  show,
  children,
  className,
  duration = 200,
  origin = "center",
}) => {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const originClass = {
    center: "origin-center",
    top: "origin-top",
    bottom: "origin-bottom",
    left: "origin-left",
    right: "origin-right",
  }[origin];

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "transition-all",
        originClass,
        show ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Slide transition
interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: string;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  children,
  className,
  duration = 300,
  direction = "up",
  distance = "1rem",
}) => {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const transforms = {
    up: `translateY(${distance})`,
    down: `translateY(-${distance})`,
    left: `translateX(${distance})`,
    right: `translateX(-${distance})`,
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn("transition-all", className)}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0,
        transform: show ? "translate(0)" : transforms[direction],
      }}
    >
      {children}
    </div>
  );
};
