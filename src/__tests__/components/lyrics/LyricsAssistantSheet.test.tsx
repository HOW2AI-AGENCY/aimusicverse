import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LyricsAssistantSheet } from "@/components/generate-form/lyrics/LyricsAssistantSheet";

describe("LyricsAssistantSheet", () => {
  it("renders preview row when currentText provided", () => {
    render(
      <LyricsAssistantSheet
        open={true}
        onOpenChange={vi.fn()}
        currentText="[Verse]
Hello"
        onApply={vi.fn()}
      />,
    );
    expect(screen.getByText(/Ваш текущий текст/i)).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.tagName === "PRE" && node.textContent?.includes("Hello") === true),
    ).toBeInTheDocument();
  });

  it("hides preview when collapsed", () => {
    render(
      <LyricsAssistantSheet
        open={true}
        onOpenChange={vi.fn()}
        currentText="[Verse]
Line1
Line2
Line3"
        onApply={vi.fn()}
      />,
    );
    const collapseBtn = screen.getByLabelText(/скрыть превью/i);
    fireEvent.click(collapseBtn);
    expect(screen.queryByText("Line1")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Готово clicked", () => {
    const onOpenChange = vi.fn();
    render(<LyricsAssistantSheet open={true} onOpenChange={onOpenChange} currentText="" onApply={vi.fn()} />);
    fireEvent.click(screen.getByText("Готово"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
