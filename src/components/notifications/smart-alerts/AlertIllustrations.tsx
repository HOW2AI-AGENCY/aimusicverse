import { motion } from '@/lib/motion';

interface IllustrationProps {
  className?: string;
}

export function ServerBusyIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      {/* Gears */}
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '24px 24px' }}
        >
          <path
            d="M24 16c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"
            fill="currentColor"
            className="text-orange-500"
          />
          <path
            d="M32 22h-2c-.2-.8-.4-1.6-.8-2.4l1.4-1.4-2.8-2.8-1.4 1.4c-.8-.4-1.6-.6-2.4-.8v-2h-4v2c-.8.2-1.6.4-2.4.8l-1.4-1.4-2.8 2.8 1.4 1.4c-.4.8-.6 1.6-.8 2.4h-2v4h2c.2.8.4 1.6.8 2.4l-1.4 1.4 2.8 2.8 1.4-1.4c.8.4 1.6.6 2.4.8v2h4v-2c.8-.2 1.6-.4 2.4-.8l1.4 1.4 2.8-2.8-1.4-1.4c.4-.8.6-1.6.8-2.4h2v-4z"
            fill="currentColor"
            className="text-orange-400"
          />
        </motion.g>
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '44px 44px' }}
        >
          <path
            d="M44 38c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"
            fill="currentColor"
            className="text-red-500"
          />
        </motion.g>
        {/* Warning symbol */}
        <motion.path
          d="M52 20l-4 8h8l-4-8zm0 3l1.5 3h-3l1.5-3z"
          fill="currentColor"
          className="text-yellow-500"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

export function EmptyProjectsIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Folder */}
        <motion.path
          d="M52 20H28l-4-4H12c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4z"
          fill="currentColor"
          className="text-blue-400/30"
        />
        <motion.path
          d="M52 24H12v28h40V24z"
          fill="currentColor"
          className="text-blue-500/20"
        />
        {/* Plus sign */}
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x="30" y="32" width="4" height="16" rx="2" fill="currentColor" className="text-blue-500" />
          <rect x="24" y="38" width="16" height="4" rx="2" fill="currentColor" className="text-blue-500" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

export function ProfileSetupIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Avatar circle */}
        <circle cx="32" cy="24" r="10" fill="currentColor" className="text-purple-400" />
        <path
          d="M32 36c-12 0-20 8-20 16v4h40v-4c0-8-8-16-20-16z"
          fill="currentColor"
          className="text-purple-500/50"
        />
        {/* Pencil */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ transformOrigin: '50px 18px' }}
        >
          <rect x="46" y="10" width="8" height="20" rx="1" fill="currentColor" className="text-amber-400" />
          <polygon points="50,30 46,38 54,38" fill="currentColor" className="text-amber-600" />
          <rect x="46" y="8" width="8" height="4" rx="1" fill="currentColor" className="text-pink-400" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

export function StemsReadyIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Audio tracks */}
        {[0, 1, 2, 3].map((i) => (
          <motion.rect
            key={i}
            x="8"
            y={12 + i * 12}
            width="48"
            height="8"
            rx="2"
            fill="currentColor"
            className={['text-green-500', 'text-blue-500', 'text-purple-500', 'text-orange-500'][i]}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{ transformOrigin: 'left' }}
          />
        ))}
        {/* Waveform overlay */}
        {[0, 1, 2, 3].map((i) => (
          <motion.g key={`wave-${i}`}>
            {[...Array(6)].map((_, j) => (
              <motion.rect
                key={j}
                x={12 + j * 8}
                y={14 + i * 12}
                width="4"
                height="4"
                rx="1"
                fill="currentColor"
                className="text-white/30"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.5, delay: j * 0.1, repeat: Infinity }}
              />
            ))}
          </motion.g>
        ))}
      </motion.svg>
    </div>
  );
}

export function ArtistCreateIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Microphone */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x="26" y="8" width="12" height="24" rx="6" fill="currentColor" className="text-pink-500" />
          <rect x="24" y="20" width="16" height="2" fill="currentColor" className="text-pink-600" />
          <rect x="24" y="24" width="16" height="2" fill="currentColor" className="text-pink-600" />
        </motion.g>
        <path
          d="M20 28v4c0 6.6 5.4 12 12 12s12-5.4 12-12v-4h-4v4c0 4.4-3.6 8-8 8s-8-3.6-8-8v-4h-4z"
          fill="currentColor"
          className="text-gray-500"
        />
        <rect x="30" y="44" width="4" height="8" fill="currentColor" className="text-gray-500" />
        <rect x="24" y="52" width="16" height="4" rx="2" fill="currentColor" className="text-gray-600" />
        {/* AI sparkles */}
        <motion.circle
          cx="48" cy="16" r="3"
          fill="currentColor"
          className="text-cyan-400"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="52" cy="24" r="2"
          fill="currentColor"
          className="text-cyan-300"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, delay: 0.3, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

export function RewardIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Trophy */}
        <motion.path
          d="M44 8H20v8c0 8.8 5.4 16 12 16s12-7.2 12-16V8z"
          fill="currentColor"
          className="text-amber-400"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <path d="M16 8h-4v8c0 4.4 2.2 8 6 8v-4c-1.2 0-2-1.8-2-4V8z" fill="currentColor" className="text-amber-500" />
        <path d="M48 8h4v8c0 4.4-2.2 8-6 8v-4c1.2 0 2-1.8 2-4V8z" fill="currentColor" className="text-amber-500" />
        <rect x="28" y="32" width="8" height="8" fill="currentColor" className="text-amber-600" />
        <rect x="24" y="40" width="16" height="6" rx="2" fill="currentColor" className="text-amber-700" />
        {/* Sparkles */}
        {[
          { x: 10, y: 12, delay: 0 },
          { x: 54, y: 8, delay: 0.2 },
          { x: 8, y: 28, delay: 0.4 },
          { x: 56, y: 24, delay: 0.6 },
        ].map((star, i) => (
          <motion.circle
            key={i}
            cx={star.x}
            cy={star.y}
            r="2"
            fill="currentColor"
            className="text-yellow-300"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, delay: star.delay, repeat: Infinity }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

export function WelcomeBackIllustration({ className }: IllustrationProps) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <motion.svg
        viewBox="0 0 64 64"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Music note */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="20" cy="44" r="8" fill="currentColor" className="text-primary" />
          <rect x="26" y="16" width="4" height="28" fill="currentColor" className="text-primary" />
          <path d="M30 16c0 0 12-4 12 8v8c0-12-12-8-12-8z" fill="currentColor" className="text-primary/80" />
        </motion.g>
        {/* Wave hand */}
        <motion.g
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: '50px 32px' }}
        >
          <circle cx="50" cy="32" r="10" fill="currentColor" className="text-amber-300" />
          <rect x="48" y="22" width="4" height="8" rx="2" fill="currentColor" className="text-amber-300" />
          <rect x="52" y="24" width="3" height="6" rx="1.5" fill="currentColor" className="text-amber-300" />
          <rect x="44" y="24" width="3" height="6" rx="1.5" fill="currentColor" className="text-amber-300" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

export const illustrations: Record<string, React.FC<IllustrationProps>> = {
  'server-busy': ServerBusyIllustration,
  'empty-projects': EmptyProjectsIllustration,
  'profile-setup': ProfileSetupIllustration,
  'stems-ready': StemsReadyIllustration,
  'artist-create': ArtistCreateIllustration,
  'reward': RewardIllustration,
  'welcome-back': WelcomeBackIllustration,
};
