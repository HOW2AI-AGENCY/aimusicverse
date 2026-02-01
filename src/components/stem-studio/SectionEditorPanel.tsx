/**
 * Section Editor Panel - Enhanced
 * Uses modular components for clean architecture
 * 
 * Features:
 * - Enhanced waveform with replaced section markers
 * - A/B comparison overlay for completed replacements
 * - Real waveform data visualization
 * 
 * Performance: React.memo with custom comparison (IMP057)
 */

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from '@/lib/motion';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement } from '@/hooks/useSectionReplacement';
import { SectionPreviewPlayer } from './SectionPreviewPlayer';
import {
  SectionEditorHeader,
  SectionPresets,
  SectionPromptInput,
  SectionValidation,
  SectionActions,
  EnhancedSectionWaveform,
  ABCompareOverlay,
  type ReplacedSection,
} from './section-editor';
import { supabase } from '@/integrations/supabase/client';

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

function SectionEditorPanelInner({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  onClose,
}: SectionEditorPanelProps) {
  const { 
    selectedSection, 
    customRange, 
    clearSelection, 
    latestCompletion,
    setLatestCompletion,
    editMode,
  } = useSectionEditorStore();

  const [replacedSections, setReplacedSections] = useState<ReplacedSection[]>([]);

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

  // Load replaced sections history
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from('track_change_log')
        .select('id, change_type, metadata, created_at, version_id')
        .eq('track_id', trackId)
        .eq('change_type', 'section_replacement')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        const sections: ReplacedSection[] = data.map((log) => {
          const metadata = log.metadata as { start?: number; end?: number } | null;
          const createdAt = log.created_at ? new Date(log.created_at) : new Date();
          return {
            id: log.id,
            startTime: metadata?.start || 0,
            endTime: metadata?.end || 0,
            replacedAt: createdAt,
            versionId: log.version_id || undefined,
            label: `Замена ${createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`,
          };
        });
        setReplacedSections(sections);
      }
    };
    loadHistory();
  }, [trackId]);

  const handleClose = () => {
    reset();
    clearSelection();
    onClose();
  };

  const handleApplyComparison = useCallback(() => {
    // Apply the comparison result
    setLatestCompletion(null);
    handleClose();
  }, [setLatestCompletion, handleClose]);

  const handleDiscardComparison = useCallback(() => {
    setLatestCompletion(null);
  }, [setLatestCompletion]);

  // Show A/B comparison if we have a completed replacement
  if (latestCompletion && latestCompletion.status === 'completed' && latestCompletion.newAudioUrl) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="section-compare"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="border-b border-success/30 bg-gradient-to-r from-success/5 via-background to-success/5 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4">
            <ABCompareOverlay
              originalAudioUrl={latestCompletion.originalAudioUrl}
              newAudioUrl={latestCompletion.newAudioUrl}
              variantBUrl={latestCompletion.newAudioUrlB}
              sectionStart={latestCompletion.section.start}
              sectionEnd={latestCompletion.section.end}
              onApply={handleApplyComparison}
              onDiscard={handleDiscardComparison}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

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

          {/* Enhanced Waveform with markers */}
          <motion.div variants={itemVariants}>
            <EnhancedSectionWaveform
              audioUrl={audioUrl}
              trackId={trackId}
              duration={duration}
              startTime={startTime}
              endTime={endTime}
              isValid={isValidDuration}
              interactive
              replacedSections={replacedSections}
              showHistory={replacedSections.length > 0}
              onSelectionChange={updateRange}
              onSectionClick={(section) => {
                updateRange(section.startTime, section.endTime);
              }}
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

/**
 * Memoized Section Editor Panel
 * Only re-renders when essential props change
 */
export const SectionEditorPanel = memo(
  SectionEditorPanelInner,
  (prevProps, nextProps) => {
    return (
      prevProps.trackId === nextProps.trackId &&
      prevProps.trackTitle === nextProps.trackTitle &&
      prevProps.trackTags === nextProps.trackTags &&
      prevProps.audioUrl === nextProps.audioUrl &&
      prevProps.duration === nextProps.duration
    );
  }
);

SectionEditorPanel.displayName = 'SectionEditorPanel';
