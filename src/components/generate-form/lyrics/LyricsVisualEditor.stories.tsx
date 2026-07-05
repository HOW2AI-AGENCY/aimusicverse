/**
 * Storybook stories — LyricsVisualEditor component
 *
 * Demonstrates:
 * - Empty state
 * - Pop template structure
 * - Custom sections
 * - Drag demo
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LyricsVisualEditor } from "./LyricsVisualEditor";

const meta: Meta<typeof LyricsVisualEditor> = {
  title: "Lyrics/VisualEditor",
  component: LyricsVisualEditor,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Visual lyrics editor with drag-reorder sections, templates, and AI assistant.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    text: { control: "text" },
    onChange: { action: "onChange" },
    onOpenAssistant: { action: "onOpenAssistant" },
  },
};

export default meta;
type Story = StoryObj<typeof LyricsVisualEditor>;

export const Empty: Story = {
  args: { text: "", onChange: () => {}, onOpenAssistant: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Empty state with Add Section button.",
      },
    },
  },
};

export const PopTemplate: Story = {
  args: {
    text: `[Verse]
Line 1
Line 2
[Chorus]
Chorus line`,
    onChange: () => {},
    onOpenAssistant: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Pop song structure with Verse and Chorus sections.",
      },
    },
  },
};

export const CustomSections: Story = {
  args: {
    text: `[Bridge]
Bridge text`,
    onChange: () => {},
    onOpenAssistant: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Custom section types like Bridge, Intro, Outro.",
      },
    },
  },
};

export const DragDemo: Story = {
  args: {
    text: `[Verse]
First verse
[Chorus]
Catchy hook
[Verse]
Second verse
[Chorus]
Final hook`,
    onChange: () => {},
    onOpenAssistant: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple sections demonstrating drag-reorder functionality.",
      },
    },
  },
};
