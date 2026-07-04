/**
 * Storybook stories — ReferenceChipsRow component
 *
 * Demonstrates:
 * - Empty state
 * - All selected
 * - Overflow (many selected)
 * - Partial selection
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ReferenceChipsRow } from "./ReferenceChipsRow";

const meta: Meta<typeof ReferenceChipsRow> = {
  title: "Generate/ReferenceChipsRow",
  component: ReferenceChipsRow,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Single-row reference picker with chips and overflow popover.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    references: { control: "object" },
    onAdd: { action: "onAdd" },
    onRemove: { action: "onRemove" },
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceChipsRow>;

export const Empty: Story = {
  args: {
    references: {},
    onAdd: () => {},
    onRemove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state with add buttons for all reference types.",
      },
    },
  },
};

export const AllSelected: Story = {
  args: {
    references: {
      project: { id: "p1", label: "Summer EP" },
      artist: { id: "a1", label: "Lady Gaga" },
      audio: { id: "tr1", label: "rock-demo.mp3" },
      voice: { id: "v1", label: "My Voice" },
    },
    onAdd: () => {},
    onRemove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "All reference types selected as chips.",
      },
    },
  },
};

export const PartialSelection: Story = {
  args: {
    references: {
      project: { id: "p1", label: "Summer EP" },
      voice: { id: "v1", label: "My Voice" },
    },
    onAdd: () => {},
    onRemove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Some references selected, others show add buttons.",
      },
    },
  },
};

export const LongLabels: Story = {
  args: {
    references: {
      project: { id: "p1", label: "Very Long Project Name That Truncates" },
      artist: { id: "a1", label: "Artist With Incredibly Long Name" },
    },
    onAdd: () => {},
    onRemove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Long labels truncate with ellipsis.",
      },
    },
  },
};

export const Overflow: Story = {
  args: {
    references: {
      project: { id: "p1", label: "Summer EP 2024" },
      artist: { id: "a1", label: "Lady Gaga" },
      audio: { id: "tr1", label: "Very Long Audio Filename That Should Truncate" },
    },
    onAdd: () => {},
    onRemove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple chips with long labels demonstrating overflow behavior.",
      },
    },
  },
};
