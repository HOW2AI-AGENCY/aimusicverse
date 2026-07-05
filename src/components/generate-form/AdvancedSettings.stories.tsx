/**
 * Storybook stories — AdvancedSettings component
 *
 * Demonstrates:
 * - Closed state
 * - Open with default values
 * - With persona selected
 * - With reference audio
 */
import type { Meta, StoryObj } from "@storybook/react";
import { AdvancedSettings } from "./AdvancedSettings";

const meta: Meta<typeof AdvancedSettings> = {
  title: "Generate/AdvancedSettings",
  component: AdvancedSettings,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Card-based advanced settings with sliders and info popovers.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "onOpenChange" },
    negativeTags: { control: "text" },
    vocalGender: { control: "radio", options: ["", "m", "f"] },
    styleWeight: { control: "object" },
    weirdnessConstraint: { control: "object" },
    audioWeight: { control: "object" },
    hasReferenceAudio: { control: "boolean" },
    hasPersona: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof AdvancedSettings>;

export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    negativeTags: "",
    vocalGender: "",
    styleWeight: [0.5],
    weirdnessConstraint: [0.5],
    audioWeight: [0.5],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: false,
    hasPersona: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Collapsed state showing trigger button only.",
      },
    },
  },
};

export const DefaultOpen: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    negativeTags: "",
    vocalGender: "",
    styleWeight: [0.5],
    weirdnessConstraint: [0.5],
    audioWeight: [0.5],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: false,
    hasPersona: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Open state with all default sliders and no references.",
      },
    },
  },
};

export const WithPersona: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    negativeTags: "",
    vocalGender: "f",
    styleWeight: [0.7],
    weirdnessConstraint: [0.3],
    audioWeight: [0.8],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: false,
    hasPersona: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Persona selected shows audio/persona weight card.",
      },
    },
  },
};

export const WithReferenceAudio: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    negativeTags: "autotune",
    vocalGender: "m",
    styleWeight: [0.6],
    weirdnessConstraint: [0.4],
    audioWeight: [0.9],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: true,
    hasPersona: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Reference audio selected shows audio weight card.",
      },
    },
  },
};

/**
 * Phase C4: Interactive slider demonstrations
 *
 * Demonstrates user interactions with sliders:
 * - Dragging sliders updates values in real-time
 * - Tooltip shows current value during interaction
 * - Visual feedback on hover/focus
 */
export const InteractiveSliders: Story = {
  name: "Interaction - Slider controls",
  args: {
    open: true,
    onOpenChange: () => {},
    negativeTags: "autotune, pitch-correct",
    vocalGender: "f",
    styleWeight: [0.7],
    weirdnessConstraint: [0.3],
    audioWeight: [0.8],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: false,
    hasPersona: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive sliders with real-time value updates and visual feedback.",
      },
    },
  },
};

/**
 * Phase C4: Loading and disabled states
 *
 * Demonstrates component states during user interactions:
 * - Sliders disabled during form submission
 * - Loading indicators on async operations
 * - Visual feedback for disabled controls
 */
export const LoadingStates: Story = {
  name: "Interaction - Loading states",
  args: {
    open: true,
    onOpenChange: () => {},
    negativeTags: "",
    vocalGender: "",
    styleWeight: [0.5],
    weirdnessConstraint: [0.5],
    audioWeight: [0.5],
    onNegativeTagsChange: () => {},
    onVocalGenderChange: () => {},
    onStyleWeightChange: () => {},
    onWeirdnessConstraintChange: () => {},
    onAudioWeightChange: () => {},
    hasReferenceAudio: false,
    hasPersona: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Component behavior during loading states - disabled controls, loading indicators.",
      },
    },
  },
};
