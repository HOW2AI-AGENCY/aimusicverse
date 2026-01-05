/**
 * ProjectCover - Reusable project cover with fallback and badges
 * 
 * Used in:
 * - UnifiedProjectCard (grid/list variants)
 * - ProjectDetail hero section
 * - Project selection dialogs
 */

import { memo, ReactNode } from 'react';
import { Disc } from 'lucide-react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ProjectCoverProps {
  /** Cover image URL */
  coverUrl: string | null;
  /** Alt text for image */
  alt: string;
  /** Size variant */
  variant?: 'thumbnail' | 'card' | 'hero';
  /** Whether to enable hover zoom effect */
  hoverZoom?: boolean;
  /** Badges to display on cover */
  badges?: ReactNode;
  /** Overlay content */
  overlay?: ReactNode;
  /** Additional className */
  className?: string;
  /** Cover container className */
  containerClassName?: string;
}

const VARIANT_CLASSES = {
  thumbnail: {
    container: 'w-14 h-14 rounded-lg',
    fallbackIcon: 'w-6 h-6',
  },
  card: {
    container: 'aspect-square rounded-none',
    fallbackIcon: 'w-16 h-16',
  },
  hero: {
    container: 'w-full aspect-square sm:aspect-video sm:max-h-64',
    fallbackIcon: 'w-24 h-24',
  },
};

export const ProjectCover = memo(function ProjectCover({
  coverUrl,
  alt,
  variant = 'card',
  hoverZoom = false,
  badges,
  overlay,
  className,
  containerClassName,
}: ProjectCoverProps) {
  const variantConfig = VARIANT_CLASSES[variant];

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
        variantConfig.container,
        containerClassName
      )}
    >
      {coverUrl ? (
        hoverZoom ? (
          <motion.img
            src={coverUrl}
            alt={alt}
            className={cn("w-full h-full object-cover", className)}
            loading="lazy"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <img
            src={coverUrl}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              hoverZoom && "group-hover:scale-110",
              className
            )}
            loading="lazy"
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Disc className={cn(variantConfig.fallbackIcon, "text-primary/30")} />
          </motion.div>
        </div>
      )}

      {/* Badges container */}
      {badges}

      {/* Optional overlay */}
      {overlay}
    </div>
  );
});

export default ProjectCover;
