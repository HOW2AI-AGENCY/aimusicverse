/**
 * Section Editor Panel - Refactored
 * Uses modular components for clean architecture
 */

import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement } from '@/hooks/useSectionReplacement';
import { SectionWaveformPreview } from './SectionWaveformPreview';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import {
  SectionEditorHeader,
  SectionPresets,
  SectionPromptInput,
  SectionValidation,
  SectionActions,
} from './section-editor';

const containerVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2 },
      staggerChildren: 0.04,
      delayChildren: 0.08 
    }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { 
      height: { duration: 0.2 },
      opacity: { duration: 0.15 }
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

interface SectionEditorPanelProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  onClose: () => void;
}

export function SectionEditorPanel({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  onClose,
}: SectionEditorPanelProps) {
  const { selectedSection, customRange, clearSelection } = useSectionEditorStore();

  const {
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    hasSelection,
    isValidDuration,
    isSubmitting,
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    updateRange,
    addPreset,
    executeReplacement,
    reset,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    onSuccess: onClose,
  });

  const handleClose = () => {
    reset();
    clearSelection();
    onClose();
  };

  if (!customRange && !selectedSection) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="section-editor"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Header */}
          <motion.div variants={itemVariants}>
            <SectionEditorHeader
              selectedSection={selectedSection}
              startTime={startTime}
              endTime={endTime}
              onClose={handleClose}
            />
          </motion.div>

          {/* Waveform Preview */}
          <motion.div variants={itemVariants}>
            <SectionWaveformPreview
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              isValid={isValidDuration}
              interactive
              onSelectionChange={updateRange}
            />
          </motion.div>

          {/* Audio Preview */}
          {audioUrl && (
            <motion.div variants={itemVariants}>
              <SectionPreviewPlayer
                audioUrl={audioUrl}
                startTime={startTime}
                endTime={endTime}
              />
            </motion.div>
          )}

          {/* Validation */}
          <motion.div variants={itemVariants}>
            <SectionValidation
              isValid={isValidDuration}
              sectionDuration={sectionDuration}
              maxDuration={maxDuration}
            />
          </motion.div>

          {/* Presets */}
          <motion.div variants={itemVariants}>
            <SectionPresets onSelect={addPreset} />
          </motion.div>

          {/* Prompt & Tags */}
          <motion.div variants={itemVariants}>
            <SectionPromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              tags={tags}
              onTagsChange={setTags}
              lyrics={lyrics}
              onLyricsChange={setLyrics}
              originalLyrics={selectedSection?.lyrics}
            />
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants}>
            <SectionActions
              onReplace={executeReplacement}
              onCancel={handleClose}
              isValid={isValidDuration}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
