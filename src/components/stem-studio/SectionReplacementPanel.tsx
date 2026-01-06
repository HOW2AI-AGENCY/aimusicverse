/**
 * Unified Section Replacement Panel
 * Modular, clean design for both desktop and mobile
 */

import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { useSectionReplacement } from '@/hooks/useSectionReplacement';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection, DetectedSection } from '@/hooks/useSectionDetection';
import { SectionWaveformPreview } from './SectionWaveformPreview';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import {
  SectionEditorHeader,
  SectionPresets,
  SectionPromptInput,
  SectionValidation,
  SectionActions,
} from './section-editor';
import { SectionQuickPicker } from './section-editor/SectionQuickPicker';

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

interface SectionReplacementPanelProps {
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackLyrics?: string | null;
  audioUrl?: string | null;
  duration: number;
  taskId?: string | null;
  audioId?: string | null;
  onClose: () => void;
}

export function SectionReplacementPanel({
  trackId,
  trackTitle,
  trackTags,
  trackLyrics,
  audioUrl,
  duration,
  taskId,
  audioId,
  onClose,
}: SectionReplacementPanelProps) {
  // Fetch lyrics for section detection
  const { data: lyricsData } = useTimestampedLyrics(taskId || null, audioId || null);
  const detectedSections = useSectionDetection(trackLyrics, lyricsData?.alignedWords, duration);

  const {
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    hasSelection,
    selectedSection,
    isValidDuration,
    isSubmitting,
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    selectSection,
    updateRange,
    addPreset,
    executeReplacement,
    reset,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    detectedSections,
    onSuccess: onClose,
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!hasSelection) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="section-replacement-panel"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5 overflow-hidden"
      >
        <div className="px-4 py-4 space-y-4">
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

          {/* Section Picker */}
          {detectedSections.length > 0 && (
            <motion.div variants={itemVariants}>
              <SectionQuickPicker
                sections={detectedSections}
                selectedIndex={detectedSections.findIndex(
                  s => Math.abs(s.startTime - startTime) < 0.5 && Math.abs(s.endTime - endTime) < 0.5
                )}
                maxDuration={maxDuration}
                onSelect={selectSection}
              />
            </motion.div>
          )}

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
