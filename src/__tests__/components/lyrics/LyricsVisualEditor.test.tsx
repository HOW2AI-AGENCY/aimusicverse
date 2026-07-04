import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LyricsVisualEditor } from "@/components/generate-form/lyrics/LyricsVisualEditor";

describe("LyricsVisualEditor", () => {
  it("renders empty state with 'Add section' button when no sections", () => {
    render(<LyricsVisualEditor text="" onChange={vi.fn()} onOpenAssistant={vi.fn()} />);
    expect(screen.getByText(/Добавить секцию/i)).toBeInTheDocument();
  });

  it("renders parsed sections from initial text", () => {
    render(
      <LyricsVisualEditor
        text="[Verse]
Hello
[Chorus]
World"
        onChange={vi.fn()}
        onOpenAssistant={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();
    expect(screen.getByDisplayValue("World")).toBeInTheDocument();
  });

  it("calls onChange when section content edited", () => {
    const onChange = vi.fn();
    render(
      <LyricsVisualEditor
        text="[Verse]
Hello"
        onChange={onChange}
        onOpenAssistant={vi.fn()}
      />,
    );
    const textarea = screen.getByDisplayValue("Hello");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onOpenAssistant when AI button clicked", () => {
    const onOpenAssistant = vi.fn();
    render(<LyricsVisualEditor text="" onChange={vi.fn()} onOpenAssistant={onOpenAssistant} />);
    fireEvent.click(screen.getByText(/AI-помощник/i));
    expect(onOpenAssistant).toHaveBeenCalled();
  });
});
