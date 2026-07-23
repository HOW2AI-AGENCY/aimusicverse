/**
 * LyricsAssistantChat
 *
 * Sprint 056 — Task 7. Chat body composed from lyrics-chat primitives.
 * Now wired to useLyricsAssistant hook for actual AI interaction.
 */

import { ChatMessageList } from "@/components/generate-form/lyrics-chat/ChatMessageList";
import { ChatInputArea } from "@/components/generate-form/lyrics-chat/ChatInputArea";
import { useLyricsAssistant } from "@/hooks/lyrics/useLyricsAssistant";

interface Props {
  currentLyrics: string;
  onApply: (text: string, targetSectionId?: string) => void;
  onApplyTitle?: (title: string) => void;
  onApplyStyle?: (style: string) => void;
}

export function LyricsAssistantChat({ currentLyrics, onApply, onApplyTitle, onApplyStyle }: Props) {
  const state = useLyricsAssistant({ currentLyrics, onApply, onApplyTitle, onApplyStyle });

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList
        messages={state.messages}
        isLoading={state.isLoading}
        selectedGenre={state.selectedGenre}
        selectedMoods={state.selectedMoods}
        selectedStructure={state.selectedStructure}
        copied={state.copied}
        saved={state.saved}
        isSaving={state.isSaving}
        generatedLyrics={state.generatedLyrics}
        showApplyButton
        onGenreSelect={state.handleGenreSelect}
        onMoodSelect={state.handleMoodSelect}
        onMoodConfirm={state.handleMoodConfirm}
        onStructureSelect={state.handleStructureSelect}
        onOptionClick={state.handleOptionClick}
        onCopy={state.handleCopy}
        onSave={state.handleSave}
        onRegenerate={state.handleRegenerate}
        onApply={state.handleApply}
        onContinue={state.handleContinue}
        onRequestEdit={state.handleRequestEdit}
        onTitleChange={state.handleTitleChange}
        onStyleChange={state.handleStyleChange}
        recommendedTags={state.recommendedTags}
        onAiAction={state.handleAiAction}
      />
      <ChatInputArea
        value={state.inputValue}
        onChange={state.setInputValue}
        onSend={state.handleSend}
        isLoading={state.isLoading}
        placeholder={state.isMobile ? "Опиши песню..." : "Напишите о чём песня..."}
        requireShiftEnter={state.isMobile}
        onApply={onApply}
      />
    </div>
  );
}
