import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /** Size for optimization (width in px) */
  size?: number;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, size = 80, ...props }, ref) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Optimize avatar URL with size parameter
  const optimizedSrc = React.useMemo(() => {
    if (!src) return undefined;
    return getOptimizedImageUrl(src, { 
      width: size * 2, // 2x for retina
      height: size * 2,
      quality: 75 
    });
  }, [src, size]);

  return (
    <>
      {/* Blur placeholder while loading */}
      {!isLoaded && optimizedSrc && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted animate-pulse rounded-full"
          aria-hidden="true"
        />
      )}
      <AvatarPrimitive.Image 
        ref={ref} 
        src={optimizedSrc}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "aspect-square h-full w-full transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )} 
        {...props} 
      />
    </>
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
