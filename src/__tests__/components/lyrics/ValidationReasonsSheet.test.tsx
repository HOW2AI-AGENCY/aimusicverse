import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ValidationReasonsSheet } from "@/components/generate-sheet/ValidationReasonsSheet";
import type { ValidationReason } from "@/hooks/generation/useGenerateSheetValidation";

const reasons: ValidationReason[] = [
  { field: "style", severity: "error", message: "style.empty", messageRu: "Опишите стиль трека" },
  {
    field: "credits",
    severity: "error",
    message: "credits.insufficient",
    messageRu: "Недостаточно кредитов (нужно 8, доступно 3)",
  },
  { field: "title", severity: "warning", message: "title.empty", messageRu: "Название не заполнено" },
];

describe("ValidationReasonsSheet", () => {
  it("renders all reason messages in Russian", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={reasons} />);
    expect(screen.getByText("Опишите стиль трека")).toBeInTheDocument();
    expect(screen.getByText(/Недостаточно кредитов/)).toBeInTheDocument();
    expect(screen.getByText("Название не заполнено")).toBeInTheDocument();
  });

  it("shows error and warning indicators for each reason", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={reasons} />);
    // 2 errors in the test data → 2 ❌ icons; 1 warning → 1 ⚠️ icon
    expect(screen.getAllByText("❌")).toHaveLength(2);
    expect(screen.getAllByText("⚠️")).toHaveLength(1);
  });

  it("calls onOpenChange(false) when close button clicked", () => {
    const onOpenChange = vi.fn();
    render(<ValidationReasonsSheet open={true} onOpenChange={onOpenChange} reasons={reasons} />);
    fireEvent.click(screen.getByText("Закрыть"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders empty state when no reasons", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={[]} />);
    expect(screen.getByText("Всё готово к генерации")).toBeInTheDocument();
  });
});
