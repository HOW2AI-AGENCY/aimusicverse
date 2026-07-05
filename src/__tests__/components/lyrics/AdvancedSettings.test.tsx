// src/__tests__/components/lyrics/AdvancedSettings.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdvancedSettings } from "@/components/generate-form/AdvancedSettings";

const defaults = {
  negativeTags: "",
  vocalGender: "" as const,
  styleWeight: [0.5],
  weirdnessConstraint: [0.5],
  audioWeight: [0.5],
};

describe("AdvancedSettings card layout", () => {
  it("renders cards for each parameter", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.getByText(/Влияние стиля/)).toBeInTheDocument();
    expect(screen.getByText(/Креативность/)).toBeInTheDocument();
    expect(screen.getByText(/Пол вокала/)).toBeInTheDocument();
    expect(screen.getByText(/Исключить/)).toBeInTheDocument();
  });

  it("hides audio weight card when no reference audio and no persona", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.queryByText(/Сила аудио|Сила персоны/)).not.toBeInTheDocument();
  });

  it("shows audio weight card when hasReferenceAudio=true", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={true}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.getByText(/Сила аудио/)).toBeInTheDocument();
  });

  it("calls onStyleWeightChange when slider moved", () => {
    const onStyleWeightChange = vi.fn();
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={onStyleWeightChange}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    const sliders = screen.getAllByRole("slider");
    fireEvent.keyDown(sliders[0], { key: "ArrowRight" });
    expect(onStyleWeightChange).toHaveBeenCalled();
  });
});
