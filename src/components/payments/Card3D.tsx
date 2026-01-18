/**
 * 3D Credit Card Component with animations
 * Interactive card with flip, tilt, and shine effects
 */

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from '@/lib/motion';
import { CreditCard, Lock, Wifi } from 'lucide-react';

interface Card3DProps {
  className?: string;
  cardNumber?: string;
  expiryDate?: string;
  holderName?: string;
  isProcessing?: boolean;
}

export function Card3D({ 
  className = '',
  cardNumber = '•••• •••• •••• ••••',
  expiryDate = 'MM/YY',
  holderName = 'YOUR NAME',
  isProcessing = false,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Motion values for 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform mouse position to rotation
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  // Spring animation for smooth movement
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  // Shine effect position
  const shineX = useTransform(x, [-100, 100], [0, 100]);
  const shineY = useTransform(y, [-100, 100], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        ref={cardRef}
        className="relative w-full aspect-[1.586/1] max-w-[340px] mx-auto cursor-pointer preserve-3d"
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 30 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front of card */}
        <motion.div 
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Card background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(207,90%,45%)] via-[hsl(220,80%,40%)] to-[hsl(250,80%,35%)]" />
          
          {/* Animated mesh pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="card-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#card-pattern)" />
            </svg>
          </div>

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
            style={{
              opacity: 0.5,
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            }}
          />

          {/* Processing animation */}
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Card content */}
          <div className="relative z-10 flex flex-col justify-between h-full p-5">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-5 h-5 text-white/80 rotate-90" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Contactless</span>
              </div>
              <motion.div
                animate={isProcessing ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Lock className="w-4 h-4 text-white/80" />
              </motion.div>
            </div>

            {/* Chip */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg">
                <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-px p-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-yellow-600/30 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Card number */}
            <div className="space-y-1">
              <p className="text-lg sm:text-xl font-mono text-white tracking-[0.2em] drop-shadow-md">
                {cardNumber}
              </p>
            </div>

            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] text-white/50 uppercase tracking-wider">Card Holder</p>
                <p className="text-sm font-medium text-white tracking-wider uppercase">{holderName}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/50 uppercase tracking-wider">Expires</p>
                <p className="text-sm font-mono text-white">{expiryDate}</p>
              </div>
              <div className="flex flex-col items-end">
                <CreditCard className="w-10 h-8 text-white/90" />
              </div>
            </div>
          </div>

          {/* Edge highlight */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 ring-inset" />
        </motion.div>

        {/* Back of card */}
        <motion.div 
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,20%,20%)] via-[hsl(220,20%,15%)] to-[hsl(220,20%,10%)]" />
          
          {/* Magnetic stripe */}
          <div className="absolute top-8 left-0 right-0 h-12 bg-[hsl(0,0%,8%)]" />
          
          {/* Signature strip and CVV */}
          <div className="absolute top-24 left-4 right-4 flex gap-2">
            <div className="flex-1 h-10 bg-white/90 rounded flex items-center justify-end px-3">
              <div className="w-20 h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
            </div>
            <div className="w-14 h-10 bg-white/90 rounded flex items-center justify-center">
              <p className="font-mono text-gray-800 text-sm">•••</p>
            </div>
          </div>

          {/* Info text */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-[8px] text-white/40 leading-relaxed">
              Authorized signature – not valid unless signed. 
              This card is property of issuing bank and must be returned on request.
            </p>
          </div>

          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 ring-inset" />
        </motion.div>
      </motion.div>

      {/* Helper text */}
      <motion.p 
        className="text-center text-xs text-muted-foreground mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Нажмите на карту, чтобы перевернуть
      </motion.p>
    </div>
  );
}

// CSS needs to be added to support 3D transforms
// Add to your global styles or tailwind config:
// .perspective-1000 { perspective: 1000px; }
// .preserve-3d { transform-style: preserve-3d; }
// .backface-hidden { backface-visibility: hidden; }
