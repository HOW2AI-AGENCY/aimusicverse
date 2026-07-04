/**
 * LyricsAssistantChat
 *
 * Sprint 056 — Task 7. Thin wrapper composing the existing
 * `ChatMessageList` + `ChatInputArea` primitives from the
 * lyrics-chat module. Designed to live inside the vaul bottom
 * sheet produced by `LyricsAssistantSheet`. Imports are direct
 * (no barrel) to avoid circular re-export cycles per CLAUDE.md
 * pitfall #10.
 */
import { ChatMessageList } from "@/components/generate-form/lyrics-chat/ChatMessageList";
import { ChatInputArea } from "@/components/generate-form/lyrics-chat/ChatInputArea";

interface Props {
  onApply: (text: string, targetSectionId?: string) => void;
}

export function LyricsAssistantChat({ onApply }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          messages={[]}
          isLoading={false}
          selectedGenre=""
          selectedMoods={[]}
          selectedStructure=""
          copied={false}
          saved={false}
          isSaving={false}
          generatedLyrics=""
          onGenreSelect={() => undefined}
          onMoodSelect={() => undefined}
          onMoodConfirm={() => undefined}
          onStructureSelect={() => undefined}
          onOptionClick={() => undefined}
          onCopy={() => undefined}
          onSave={() => undefined}
          onRegenerate={() => undefined}
          onApply={() => onApply("")}
          onContinue={() => undefined}
        />
      </div>
      <ChatInputArea value="" onChange={() => undefined} onSend={() => undefined} onApply={onApply} />
    </div>
  );
}
