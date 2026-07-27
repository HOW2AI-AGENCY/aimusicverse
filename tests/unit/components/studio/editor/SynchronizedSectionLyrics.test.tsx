import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SynchronizedSectionLyrics } from "@/components/studio/editor/SynchronizedSectionLyrics";
import { AlignedWord } from "@/hooks/useTimestampedLyrics";

const words: AlignedWord[] = [
  { word: "старый", startS: 10, endS: 10.4, success: true, palign: 0.99 },
  { word: "текст", startS: 10.5, endS: 11, success: true, palign: 0.99 },
];

function ControlledLyricsEditor() {
  const onBaselineLyricsChange = vi.fn();
  const [lyrics, setLyrics] = useState("старый текст");

  return (
    <SynchronizedSectionLyrics
      words={words}
      startTime={10}
      endTime={11}
      currentTime={0}
      isPlaying={false}
      initialLyrics={lyrics}
      onBaselineLyricsChange={onBaselineLyricsChange}
      onLyricsChange={setLyrics}
    />
  );
}

describe("SynchronizedSectionLyrics", () => {
  it("keeps saved section lyrics visible instead of reverting to timestamped words", () => {
    render(<ControlledLyricsEditor />);

    fireEvent.click(screen.getByRole("button", { name: /изменить/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "новый текст секции" } });
    fireEvent.click(screen.getByRole("button", { name: /сохранить/i }));

    expect(screen.getByText("новый текст секции")).toBeInTheDocument();
    expect(screen.queryByText("старый")).not.toBeInTheDocument();
  });
});