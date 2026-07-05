// src/__tests__/components/lyrics/ReferenceChipsRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReferenceChipsRow } from "@/components/generate-sheet/ReferenceChipsRow";

describe("ReferenceChipsRow", () => {
  it("renders 4 empty add buttons when nothing selected", () => {
    render(<ReferenceChipsRow references={{}} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText(/Project|Альбом/i)).toBeInTheDocument();
    expect(screen.getByText(/Artist|Артист/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio|Аудио/i)).toBeInTheDocument();
    expect(screen.getByText(/Voice|Голос/i)).toBeInTheDocument();
  });

  it("renders selected project as filled chip with remove button", () => {
    render(
      <ReferenceChipsRow
        references={{ project: { id: "p1", label: "Summer EP" } }}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Summer EP")).toBeInTheDocument();
    expect(screen.getByLabelText(/удалить/i)).toBeInTheDocument();
  });

  it("calls onRemove when remove clicked", () => {
    const onRemove = vi.fn();
    render(
      <ReferenceChipsRow
        references={{ artist: { id: "a1", label: "Lady Gaga" } }}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByLabelText(/удалить/i));
    expect(onRemove).toHaveBeenCalledWith("artist", "a1");
  });

  it("calls onAdd with kind when empty button clicked", () => {
    const onAdd = vi.fn();
    render(<ReferenceChipsRow references={{}} onAdd={onAdd} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByText(/Project|Альбом/i));
    expect(onAdd).toHaveBeenCalledWith("project");
  });
});
