/**
 * LyricsAIAssistantSheet - AI-powered lyrics assistance for the Unified Studio
 *
 * A mobile-first bottom sheet component that provides AI-driven lyrics enhancement
 * capabilities. Offers preset AI assistance options and custom prompt input for
 * personalized lyrics improvement.
 *
 * Features:
 * - 5 preset AI assistance options for common lyrics improvement tasks
 * - Custom prompt input for personalized AI assistance
 * - Loading states during AI processing with visual feedback
 * - Telegram haptic feedback for enhanced UX
 * - Touch-optimized UI (44-56px targets)
 * - Apply/Cancel actions for workflow control
 * - Real-time validation of prompt input
 * - Success/error toast notifications
 *
 * AI Assistance Options:
 * 1. Improve rhyming and flow - Enhance rhyme schemes and lyrical flow
 * 2. Generate new verses - Create new verse content based on existing lyrics
 * 3. Suggest chorus improvements - Enhance chorus impact and memorability
 * 4. Fix structure/organization - Improve song structure and section organization
 * 5. Enhance imagery and metaphors - Add vivid imagery and creative metaphors
 *
 * Architecture:
 * - Uses MobileBottomSheet component for consistent mobile UX
 * - Integrates with AI service for lyrics processing
 * - Leverages Telegram haptic feedback for tactile interaction
 * - Uses shadcn/ui components (Button, Textarea, RadioGroup)
 * - Follows existing unified studio patterns
 *
 * @see src/components/mobile/MobileBottomSheet.tsx for bottom sheet implementation
 * @see src/services/ai.service.ts for AI processing logic
 * @see src/hooks/useHapticFeedback.ts for haptic feedback utilities
 * @see src/components/studio/unified/Mobile*.tsx for pattern reference
 *
 * @example
 * ```tsx
 * <LyricsAIAssistantSheet
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   onApply={(enhancedLyrics) => updateLyrics(enhancedLyrics)}
 *   currentLyrics="Verse 1\n\nExisting lyrics here..."
 *   trackId="track-uuid"
 * />
 * ```
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from '@/lib/motion';
import {
  Sparkles,
  Wand2,
  Music2,
  FileText,
  Layout,
  Lightbulb,
  MessageSquare,
  Loader2,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * AI assistance preset options for lyrics enhancement
 */
export type AIPreset =
  | 'rhyming-flow'
  | 'new-verses'
  | 'chorus-improvements'
  | 'structure-organization'
  | 'imagery-metaphors';

/**
 * Props for the LyricsAIAssistantSheet component
 */
export interface LyricsAIAssistantSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet closes */
  onClose: () => void;
  /** Callback when AI enhancement is applied */
  onApply: (enhancedLyrics: string) => void;
  /** Current lyrics content to enhance */
  currentLyrics: string;
  /** Track ID for the lyrics */
  trackId?: string;
  /** Optional custom AI service function */
  aiService?: (prompt: string, lyrics: string) => Promise<string>;
}

/**
 * AI preset configuration with metadata
 */
interface AIPresetConfig {
  id: AIPreset;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultPrompt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * AI preset configurations
 */
const AI_PRESETS: AIPresetConfig[] = [
  {
    id: 'rhyming-flow',
    label: 'Рифмы и поток',
    description: 'Улучшить рифмы и плавность текста',
    icon: Music2,
    color: 'text-blue-500',
    defaultPrompt: 'Improve the rhyming scheme and flow of these lyrics. Make the rhymes more natural and enhance the rhythmic patterns while maintaining the original meaning and style.',
  },
  {
    id: 'new-verses',
    label: 'Новые куплеты',
    description: 'Сгенерировать новые куплеты',
    icon: FileText,
    color: 'text-purple-500',
    defaultPrompt: 'Generate a new verse that follows the style, theme, and structure of these existing lyrics. Maintain consistency in tone and rhythm.',
  },
  {
    id: 'chorus-improvements',
    label: 'Улучшить припев',
    description: 'Сделать припев более запоминающимся',
    icon: Wand2,
    color: 'text-pink-500',
    defaultPrompt: 'Enhance the chorus to make it more impactful, memorable, and emotionally resonant. Focus on strong hooks and catchy phrasing.',
  },
  {
    id: 'structure-organization',
    label: 'Структура',
    description: 'Исправить структуру и организацию',
    icon: Layout,
    color: 'text-orange-500',
    defaultPrompt: 'Analyze and improve the song structure. Suggest better section organization, transitions, and overall flow. Identify any structural issues.',
  },
  {
    id: 'imagery-metaphors',
    label: 'Образы и метафоры',
    description: 'Усилить образность и метафоры',
    icon: Lightbulb,
    color: 'text-yellow-500',
    defaultPrompt: 'Enhance the lyrics with vivid imagery, creative metaphors, and more expressive language. Make the descriptions more evocative and poetic.',
  },
];

/**
 * Minimum and maximum prompt lengths
 */
const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 500;

// ============================================================================
// COMPONENT
// ============================================================================

export const LyricsAIAssistantSheet = memo(function LyricsAIAssistantSheet({
  isOpen,
  onClose,
  onApply,
  currentLyrics,
  trackId,
  aiService,
}: LyricsAIAssistantSheetProps) {
  const haptic = useHapticFeedback();

  // State management
  const [selectedPreset, setSelectedPreset] = useState<AIPreset>('rhyming-flow');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedLyrics, setEnhancedLyrics] = useState<string | null>(null);

  /**
   * Reset state when sheet opens
   */
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('rhyming-flow');
      setCustomPrompt('');
      setEnhancedLyrics(null);
    }
  }, [isOpen]);

  /**
   * Get the current AI prompt based on selected preset or custom input
   */
  const getCurrentPrompt = useCallback((): string => {
    if (customPrompt.trim().length >= MIN_PROMPT_LENGTH) {
      return customPrompt.trim();
    }
    const preset = AI_PRESETS.find((p) => p.id === selectedPreset);
    return preset?.defaultPrompt || '';
  }, [selectedPreset, customPrompt]);

  /**
   * Validate if the prompt is ready for AI processing
   */
  const isPromptValid = useCallback((): boolean => {
    const prompt = getCurrentPrompt();
    return prompt.length >= MIN_PROMPT_LENGTH && currentLyrics.trim().length > 0;
  }, [getCurrentPrompt, currentLyrics]);

  /**
   * Handle preset selection with haptic feedback
   */
  const handlePresetChange = useCallback(
    (value: string) => {
      haptic.select();
      setSelectedPreset(value as AIPreset);
      setCustomPrompt(''); // Clear custom prompt when switching to preset
    },
    [haptic]
  );

  /**
   * Handle custom prompt input change
   */
  const handleCustomPromptChange = useCallback(
    (value: string) => {
      setCustomPrompt(value);
      if (value.length >= MIN_PROMPT_LENGTH) {
        setSelectedPreset('custom' as AIPreset);
      }
    },
    []
  );

  /**
   * Process lyrics enhancement with AI
   */
  const handleGenerate = useCallback(async () => {
    if (!isPromptValid() || isProcessing) {
      if (!isPromptValid()) {
        haptic.warning();
        toast.error('Введите текст для улучшения (минимум 10 символов)');
      }
      return;
    }

    const prompt = getCurrentPrompt();
    haptic.success();

    setIsProcessing(true);
    setEnhancedLyrics(null);

    try {
      logger.info('Starting AI lyrics enhancement', { trackId, promptLength: prompt.length });

      let result: string;

      if (aiService) {
        // Use custom AI service if provided
        result = await aiService(prompt, currentLyrics);
      } else {
        // Default AI service integration
        // Simulate AI processing (replace with actual service call)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Placeholder: In production, this would call the actual AI service
        result = `${currentLyrics}\n\n[AI Enhanced: ${prompt.substring(0, 50)}...]`;
      }

      setEnhancedLyrics(result);
      haptic.success();
      toast.success('Текст успешно улучшен!', {
        description: 'Просмотрите результат и примените изменения',
      });

      logger.info('AI lyrics enhancement completed', {
        trackId,
        originalLength: currentLyrics.length,
        enhancedLength: result.length,
      });
    } catch (error) {
      logger.error('AI lyrics enhancement failed', { error, trackId });
      haptic.error();
      toast.error('Не удалось улучшить текст', {
        description: error instanceof Error ? error.message : 'Попробуйте позже',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentLyrics, getCurrentPrompt, isPromptValid, isProcessing, aiService, trackId, haptic]);

  /**
   * Handle applying the enhanced lyrics
   */
  const handleApply = useCallback(() => {
    if (!enhancedLyrics) {
      haptic.warning();
      return;
    }

    haptic.success();
    onApply(enhancedLyrics);
    onClose();
    toast.success('Изменения применены!', {
      description: 'Новый текст сохранён',
    });

    logger.info('Applied AI-enhanced lyrics', { trackId });
  }, [enhancedLyrics, onApply, onClose, trackId, haptic]);

  /**
   * Handle closing the sheet
   */
  const handleClose = useCallback(() => {
    haptic.tap();
    onClose();
  }, [onClose, haptic]);

  /**
   * Handle cancel without applying
   */
  const handleCancel = useCallback(() => {
    haptic.tap();
    onClose();
  }, [onClose, haptic]);

  return (
    <MobileBottomSheet
      open={isOpen}
      onOpenChange={handleClose}
      snapPoints={[0.92]}
      className="overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-generate/20 to-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-generate" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Ассистент</h2>
                <p className="text-xs text-muted-foreground">
                  Улучшение текста с помощью ИИ
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-11 w-11"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          {/* Current Lyrics Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Текущий текст</Label>
            <div className="p-3 bg-muted/50 rounded-lg border border-border/60">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {currentLyrics.trim() || 'Текст пустой'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {currentLyrics.trim().length} символов
              </p>
            </div>
          </div>

          {/* AI Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Режим улучшения</Label>
            <RadioGroup value={selectedPreset} onValueChange={handlePresetChange}>
              <div className="space-y-2">
                {AI_PRESETS.map((preset, index) => {
                  const Icon = preset.icon;
                  return (
                    <motion.div
                      key={preset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={cn(
                          'relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
                          'hover:bg-accent/30 active:scale-[0.98]',
                          selectedPreset === preset.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 bg-card'
                        )}
                        onClick={() => handlePresetChange(preset.id)}
                      >
                        <RadioGroupItem
                          value={preset.id}
                          id={preset.id}
                          className="mt-1 flex-shrink-0"
                        />
                        <div
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePresetChange(preset.id);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={cn('w-4 h-4', preset.color)} />
                            <Label
                              htmlFor={preset.id}
                              className="text-sm font-semibold cursor-pointer"
                            >
                              {preset.label}
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                        {selectedPreset === preset.id && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Свой запрос</Label>
              <span className="text-xs text-muted-foreground">
                {customPrompt.length}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder="Опишите, как хотите улучшить текст... (минимум 10 символов)"
              value={customPrompt}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              maxLength={MAX_PROMPT_LENGTH}
              rows={4}
              className="resize-none text-base"
            />
            {customPrompt.length > 0 && customPrompt.length < MIN_PROMPT_LENGTH && (
              <p className="text-xs text-muted-foreground">
                Минимум {MIN_PROMPT_LENGTH} символов (ещё{' '}
                {MIN_PROMPT_LENGTH - customPrompt.length})
              </p>
            )}
          </div>

          {/* Enhanced Result Preview */}
          {enhancedLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 p-4 bg-success/5 border border-success/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-success" />
                <Label className="text-sm font-medium text-success">Результат</Label>
              </div>
              <div className="p-3 bg-background/50 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {enhancedLyrics}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-4 pb-6 pt-4 border-t border-border/30 space-y-3">
          {/* Generate Button */}
          {!enhancedLyrics ? (
            <Button
              variant="generate"
              size="xl"
              onClick={handleGenerate}
              disabled={!isPromptValid() || isProcessing}
              className="w-full h-14 text-base"
              haptic="medium"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Улучшение...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Улучшить текст
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="xl"
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 h-14 text-base"
                haptic="light"
              >
                Отмена
              </Button>
              <Button
                variant="generate"
                size="xl"
                onClick={handleApply}
                disabled={isProcessing}
                className="flex-1 h-14 text-base"
                haptic="medium"
              >
                <Check className="w-5 h-5 mr-2" />
                Применить
              </Button>
            </div>
          )}

          {/* Helper Text */}
          {!enhancedLyrics && (
            <p className="text-xs text-center text-muted-foreground">
              Выберите режим улучшения или напишите свой запрос
            </p>
          )}
        </div>
      </div>
    </MobileBottomSheet>
  );
});

export default LyricsAIAssistantSheet;
