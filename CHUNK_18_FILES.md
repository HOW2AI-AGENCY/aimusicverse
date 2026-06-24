# Chunk 18: Lyrics & Content Creation - File List

**Chunk Focus**: Lyrics editing, content generation, and text processing

## Total Files: 180

## Lyrics Components (18 files)
- `src/components/lyrics/KaraokeLine.tsx`
- `src/components/lyrics/KaraokeWord.tsx`
- `src/components/lyrics/OptimizedLyricsLine.tsx`
- `src/components/lyrics/OptimizedLyricsPanel.tsx`
- `src/components/lyrics/StructuredLyricsDisplay.tsx`
- `src/components/lyrics/SynchronizedLine.tsx`
- `src/components/lyrics/SynchronizedWord.tsx`
- `src/components/lyrics/UnifiedLyricsView.tsx`

### Mobile Lyrics (2 files)
- `src/components/lyrics/mobile/MobileLyricsEditor.tsx`
- `src/components/lyrics/mobile/index.ts`

### Shared Lyrics Components (7 files)
- `src/components/lyrics/shared/GenrePicker.tsx`
- `src/components/lyrics/shared/LyricsEditorToolbar.tsx`
- `src/components/lyrics/shared/MoodPicker.tsx`
- `src/components/lyrics/shared/SectionTagSelector.tsx`
- `src/components/lyrics/shared/SectionTypePicker.tsx`
- `src/components/lyrics/shared/StructurePicker.tsx`
- `src/components/lyrics/shared/TagBadge.tsx`
- `src/components/lyrics/shared/index.ts`

## Lyrics Workspace Components (68 files)
- `src/components/lyrics-workspace/AudioReferenceRecorder.tsx`
- `src/components/lyrics-workspace/CloudAudioPicker.tsx`
- `src/components/lyrics-workspace/EditableLyricsContent.tsx`
- `src/components/lyrics-workspace/LyricsAIChatAgent.tsx`
- `src/components/lyrics-workspace/LyricsHistoryBar.tsx`
- `src/components/lyrics-workspace/LyricsValidationAlert.tsx`
- `src/components/lyrics-workspace/LyricsVersionDiff.tsx`
- `src/components/lyrics-workspace/LyricsVersionsPanel.tsx`
- `src/components/lyrics-workspace/LyricsWorkspace.tsx`
- `src/components/lyrics-workspace/SectionNotesPanel.tsx`
- `src/components/lyrics-workspace/SectionReferenceDisplay.tsx`
- `src/components/lyrics-workspace/SyntaxHighlightedEditor.tsx`
- `src/components/lyrics-workspace/TagsEditor.tsx`
- `src/components/lyrics-workspace/index.ts`

### AI Agent Subdirectory (28 files)
- `src/components/lyrics-workspace/ai-agent/AIAgentTabs.tsx`
- `src/components/lyrics-workspace/ai-agent/AIProgressIndicator.tsx`
- `src/components/lyrics-workspace/ai-agent/AIResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/AIToolbar.tsx`
- `src/components/lyrics-workspace/ai-agent/AnalysisDashboard.tsx`
- `src/components/lyrics-workspace/ai-agent/CategoryToolbar.tsx`
- `src/components/lyrics-workspace/ai-agent/ContextIndicator.tsx`
- `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/QuickActionChips.tsx`
- `src/components/lyrics-workspace/ai-agent/QuickActionsBar.tsx`
- `src/components/lyrics-workspace/ai-agent/SmartToolbar.tsx`
- `src/components/lyrics-workspace/ai-agent/WorkflowPresets.tsx`
- `src/components/lyrics-workspace/ai-agent/WorkflowProgress.tsx`
- `src/components/lyrics-workspace/ai-agent/constants.ts`
- `src/components/lyrics-workspace/ai-agent/hooks/index.ts`
- `src/components/lyrics-workspace/ai-agent/hooks/useAITools.ts`
- `src/components/lyrics-workspace/ai-agent/hooks/useWorkflowEngine.ts`
- `src/components/lyrics-workspace/ai-agent/index.ts`
- `src/components/lyrics-workspace/ai-agent/types.ts`

#### AI Agent Messages (2 files)
- `src/components/lyrics-workspace/ai-agent/messages/EnhancedMessages.tsx`
- `src/components/lyrics-workspace/ai-agent/messages/index.ts`

#### AI Agent Results (13 files)
- `src/components/lyrics-workspace/ai-agent/results/DeepAnalysisResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/FullAnalysisResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/HookResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/LyricsResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/ParaphraseResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/ProducerResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/RhythmAnalyzer.tsx`
- `src/components/lyrics-workspace/ai-agent/results/RhythmResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/StructureResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/StructuredLyricsDisplay.tsx`
- `src/components/lyrics-workspace/ai-agent/results/StructuredLyricsPreview.tsx`
- `src/components/lyrics-workspace/ai-agent/results/TagsResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/TranslateResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/VocalMapResultCard.tsx`
- `src/components/lyrics-workspace/ai-agent/results/index.ts`

#### AI Agent Tools (10 files)
- `src/components/lyrics-workspace/ai-agent/tools/AnalyzeToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/ContinueToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/OptimizeToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/ProducerToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/RhymeToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/StructureToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/StyleConvertToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/TranslateToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/WriteToolPanel.tsx`
- `src/components/lyrics-workspace/ai-agent/tools/index.ts`

## Generation Components (9 files)
- `src/components/generation/ArtistNameErrorAlert.tsx`
- `src/components/generation/ContinueCreatingCTA.tsx`
- `src/components/generation/GenerationErrorCard.tsx`
- `src/components/generation/GenerationProgressBar.tsx`
- `src/components/generation/GenerationProgressStage.tsx`
- `src/components/generation/GenerationStepper.tsx`
- `src/components/generation/GenerationTaskError.tsx`
- `src/components/generation/GenerationTaskIndicator.tsx`
- `src/components/generation/SectionReplacementProgress.tsx`
- `src/components/generation/index.ts`

## Generate Form Components (85 files)
- `src/components/generate-form/AILyricsAssistantDialog.tsx`
- `src/components/generate-form/AILyricsWizard.tsx`
- `src/components/generate-form/AdvancedSettings.tsx`
- `src/components/generate-form/ArtistSelector.tsx`
- `src/components/generate-form/AudioActionDialog.tsx`
- `src/components/generate-form/AudioReferenceUpload.tsx`
- `src/components/generate-form/AudioTrimSelector.tsx`
- `src/components/generate-form/AudioUploadActionDialog.tsx`
- `src/components/generate-form/CollapsibleFormHeader.tsx`
- `src/components/generate-form/CreditBalanceIndicator.tsx`
- `src/components/generate-form/CreditBalanceWarning.tsx`
- `src/components/generate-form/FormSection.tsx`
- `src/components/generate-form/GenerateFormActions.tsx`
- `src/components/generate-form/GenerateFormCustom.tsx`
- `src/components/generate-form/GenerateFormHint.tsx`
- `src/components/generate-form/GenerateFormReferences.tsx`
- `src/components/generate-form/GenerateFormSimple.tsx`
- `src/components/generate-form/GenerationLoadingState.tsx`
- `src/components/generate-form/GenerationResultSheet.tsx`
- `src/components/generate-form/GenerationStepIndicator.tsx`
- `src/components/generate-form/GuitarModeRecorder.tsx`
- `src/components/generate-form/GuitarRecordDialog.tsx`
- `src/components/generate-form/LyricsChatAssistant.tsx`
- `src/components/generate-form/LyricsVisualEditor.tsx`
- `src/components/generate-form/LyricsVisualEditorCompact.tsx`
- `src/components/generate-form/ProjectTrackSelector.tsx`
- `src/components/generate-form/PromptHistory.tsx`
- `src/components/generate-form/PromptValidationAlert.tsx`
- `src/components/generate-form/ProviderSelector.tsx`
- `src/components/generate-form/QuickGenerateMode.tsx`
- `src/components/generate-form/RecordMelodyDialog.tsx`
- `src/components/generate-form/SaveTemplateDialog.tsx`
- `src/components/generate-form/SavedLyricsSelector.tsx`
- `src/components/generate-form/SectionLabel.tsx`
- `src/components/generate-form/SectionTagSelector.tsx`
- `src/components/generate-form/SmartPromptSuggestions.tsx`
- `src/components/generate-form/StylePresetSelector.tsx`
- `src/components/generate-form/TagBuilderPanel.tsx`
- `src/components/generate-form/ValidationMessage.tsx`
- `src/components/generate-form/index.ts`
- `src/components/generate-form/inspirationPrompts.ts`

### Lyrics Chat Subdirectory (8 files)
- `src/components/generate-form/lyrics-chat/ChatComponents.tsx`
- `src/components/generate-form/lyrics-chat/ChatInputArea.tsx`
- `src/components/generate-form/lyrics-chat/ChatMessageBubble.tsx`
- `src/components/generate-form/lyrics-chat/ChatMessageList.tsx`
- `src/components/generate-form/lyrics-chat/ContextRecommendations.tsx`
- `src/components/generate-form/lyrics-chat/EnhancedLyricsPreview.tsx`
- `src/components/generate-form/lyrics-chat/QuickActions.tsx`
- `src/components/generate-form/lyrics-chat/constants.ts`
- `src/components/generate-form/lyrics-chat/index.ts`
- `src/components/generate-form/lyrics-chat/quickActions.ts`
- `src/components/generate-form/lyrics-chat/types.ts`
- `src/components/generate-form/lyrics-chat/useLyricsChat.ts`

### Lyrics Wizard Subdirectory (5 files)
- `src/components/generate-form/lyrics-wizard/ConceptStep.tsx`
- `src/components/generate-form/lyrics-wizard/EnrichmentStep.tsx`
- `src/components/generate-form/lyrics-wizard/FinalizeStep.tsx`
- `src/components/generate-form/lyrics-wizard/StructureStep.tsx`
- `src/components/generate-form/lyrics-wizard/WritingStep.tsx`

### Form Sections (6 files)
- `src/components/generate-form/sections/LyricsSection.tsx`
- `src/components/generate-form/sections/LyricsSectionAdvanced.tsx`
- `src/components/generate-form/sections/PrivacyToggle.tsx`
- `src/components/generate-form/sections/StyleSection.tsx`
- `src/components/generate-form/sections/TitleSection.tsx`
- `src/components/generate-form/sections/VocalsToggle.tsx`
- `src/components/generate-form/sections/index.ts`

### Smart Assistant Subdirectory (4 files)
- `src/components/generate-form/smart-assistant/SmartAssistantInline.tsx`
- `src/components/generate-form/smart-assistant/SmartAssistantPanel.tsx`
- `src/components/generate-form/smart-assistant/SmartSuggestionCard.tsx`
- `src/components/generate-form/smart-assistant/index.ts`
- `src/components/generate-form/smart-assistant/types.ts`

### Wizard Subdirectory (8 files)
- `src/components/generate-form/wizard/GenerationWizard.tsx`
- `src/components/generate-form/wizard/WizardProgress.tsx`
- `src/components/generate-form/wizard/index.ts`
- `src/components/generate-form/wizard/steps/IdeaStep.tsx`
- `src/components/generate-form/wizard/steps/LyricsStep.tsx`
- `src/components/generate-form/wizard/steps/PreviewStep.tsx`
- `src/components/generate-form/wizard/steps/SettingsStep.tsx`
- `src/components/generate-form/wizard/steps/StyleStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsStep.tsx`

## Prompt DJ Components (30 files)
- `src/components/prompt-dj/ChannelCard.tsx`
- `src/components/prompt-dj/CompactVisualizer.tsx`
- `src/components/prompt-dj/ControlPanel.tsx`
- `src/components/prompt-dj/DrumIntegration.tsx`
- `src/components/prompt-dj/EditablePromptPreview.tsx`
- `src/components/prompt-dj/EssentialsKnobGrid.tsx`
- `src/components/prompt-dj/GenerateButton.tsx`
- `src/components/prompt-dj/GenreCrossfader.tsx`
- `src/components/prompt-dj/GlobalControls.tsx`
- `src/components/prompt-dj/InstrumentSelector.tsx`
- `src/components/prompt-dj/KnobCell.tsx`
- `src/components/prompt-dj/LiveVisualizer.tsx`
- `src/components/prompt-dj/MoodStyleSelector.tsx`
- `src/components/prompt-dj/PromptDJClean.tsx`
- `src/components/prompt-dj/PromptDJErrorBoundary.tsx`
- `src/components/prompt-dj/PromptDJMidi.tsx`
- `src/components/prompt-dj/PromptDJMixer.tsx`
- `src/components/prompt-dj/PromptDJOnboarding.tsx`
- `src/components/prompt-dj/PromptKnob.tsx`
- `src/components/prompt-dj/PromptKnobEnhanced.tsx`
- `src/components/prompt-dj/QuickMixPresets.tsx`
- `src/components/prompt-dj/QuickPresets.tsx`
- `src/components/prompt-dj/QuickStartSheet.tsx`
- `src/components/prompt-dj/RealisticKnob.tsx`
- `src/components/prompt-dj/SmartPresetsPanel.tsx`
- `src/components/prompt-dj/SmartSuggestions.tsx`
- `src/components/prompt-dj/StyleCrossfader.tsx`
- `src/components/prompt-dj/TrackHistoryItem.tsx`
- `src/components/prompt-dj/Visualizer.tsx`
- `src/components/prompt-dj/VoiceInput.tsx`
- `src/components/prompt-dj/index.ts`

## Key Features in This Chunk

### Lyrics Processing
- Karaoke-style synchronized lyrics display
- AI-powered lyrics writing assistant
- Lyrics version history and diffing
- Multi-language translation support
- Rhyme and rhythm analysis
- Structure and mood detection
- Style conversion and paraphrasing
- Genre and mood tagging

### Content Generation
- Advanced generation form with multiple modes
- Audio reference upload and trim selection
- Melody recording (guitar mode)
- Artist and style selection
- Credit balance management
- Generation progress tracking
- Template saving and loading
- Prompt history and suggestions

### AI Assistant Features
- AI chat interface for lyrics creation
- Workflow engine with presets
- Smart suggestions and recommendations
- Quick action chips
- Analysis dashboard
- Context-aware assistance
- Multi-tool support (analyze, write, optimize, translate, etc.)

### Prompt DJ
- Visual prompt engineering interface
- Knob-based parameter control
- Genre and style crossfaders
- Real-time visualization
- Drum integration
- MIDI control support
- Quick presets and smart suggestions

## Dependencies
- Zustand stores (useLyricsHistoryStore)
- React Hook Form for form management
- Zod for validation
- TanStack Query for data fetching
- Framer Motion for animations
- AI/ML services for lyrics processing
- Web Audio API for audio recording

## Related Files
- `src/hooks/useLyrics/` - Lyrics-related hooks
- `src/services/lyrics.service.ts` - Lyrics business logic
- `src/api/lyrics.api.ts` - Lyrics API calls
- `src/stores/useLyricsHistoryStore.ts` - Lyrics history state
- `src/lib/lyricsParser.ts` - Lyrics parsing utilities