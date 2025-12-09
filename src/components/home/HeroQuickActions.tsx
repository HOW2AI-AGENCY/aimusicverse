import { Sparkles, Library, FolderOpen, ListMusic, Upload, Music2, Guitar, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { UploadAudioDialog } from '@/components/UploadAudioDialog';
import { MusicRecognitionDialog } from '@/components/music-recognition/MusicRecognitionDialog';
import { GuitarRecordDialog } from '@/components/generate-form/GuitarRecordDialog';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

const quickActions = [
  { icon: Library, label: 'Библиотека', path: '/library', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
  { icon: FolderOpen, label: 'Проекты', path: '/projects', color: 'text-teal-400', bgColor: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20' },
  { icon: ListMusic, label: 'Плейлисты', path: '/playlists', color: 'text-violet-400', bgColor: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
] as const;

export function HeroQuickActions({ onGenerateClick }: HeroQuickActionsProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [guitarDialogOpen, setGuitarDialogOpen] = useState(false);

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  const handleGuitarComplete = (result: any) => {
    console.log('[HeroQuickActions] Guitar analysis complete:', result);
    // Could navigate to generation with pre-filled tags
  };

  return (
    <div className="space-y-4">
      {/* Primary CTA - Generate with enhanced design */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-generate p-4 shadow-glow touch-manipulation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, boxShadow: '0 0 40px hsl(207 90% 54% / 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.1 }}
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-lg font-bold text-primary-foreground">Создать музыку</span>
          </div>
          
          {/* Subtle glow orbs */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-generate/20 rounded-full blur-2xl" />
        </motion.button>
      </TooltipWrapper>

      {/* Quick Navigation - 2 rows layout for better touch targets */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.04 } }
        }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex items-center gap-2.5 px-3 py-3 rounded-xl",
              "border transition-all duration-200 touch-manipulation",
              action.bgColor,
              "active:scale-[0.97]"
            )}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <action.icon className={cn("w-5 h-5 shrink-0", action.color)} />
            <span className="text-xs font-medium truncate">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tools Row */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } }
        }}
      >
        {/* Upload Audio Button */}
        <motion.button
          onClick={() => handleAction(() => setUploadDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2.5 px-3 py-3 rounded-xl",
            "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Upload className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="text-xs font-medium truncate">Загрузить</span>
        </motion.button>

        {/* Guitar Record Button with NEW badge */}
        <motion.button
          onClick={() => handleAction(() => setGuitarDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2.5 px-3 py-3 rounded-xl",
            "bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Guitar className="w-5 h-5 text-orange-400 shrink-0" />
          <span className="text-xs font-medium text-orange-400 truncate">Гитара</span>
          
          {/* NEW Badge */}
          <motion.span 
            className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-orange-500 text-white shadow-sm"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.span>
        </motion.button>

        {/* Music Recognition Button */}
        <motion.button
          onClick={() => handleAction(() => setRecognitionDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2.5 px-3 py-3 rounded-xl",
            "bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Music2 className="w-5 h-5 text-purple-400 shrink-0" />
          <span className="text-xs font-medium text-purple-400 truncate">Shazam</span>
        </motion.button>
      </motion.div>

      {/* Creative Tools Row */}
      <motion.div
        className="grid grid-cols-1 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } }
        }}
      >
        <motion.button
          onClick={() => handleAction(() => navigate('/creative-tools'))}
          className={cn(
            "group relative flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl",
            "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10",
            "hover:from-pink-500/20 hover:via-purple-500/20 hover:to-indigo-500/20",
            "border border-pink-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Wand2 className="w-5 h-5 text-pink-400 shrink-0" />
          <span className="text-sm font-medium bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Creative Tools
          </span>
          
          {/* NEW Badge */}
          <motion.span 
            className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.span>
        </motion.button>
      </motion.div>

      <UploadAudioDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      <MusicRecognitionDialog
        open={recognitionDialogOpen}
        onOpenChange={setRecognitionDialogOpen}
      />

      <GuitarRecordDialog
        open={guitarDialogOpen}
        onOpenChange={setGuitarDialogOpen}
        onComplete={handleGuitarComplete}
      />
    </div>
  );
}