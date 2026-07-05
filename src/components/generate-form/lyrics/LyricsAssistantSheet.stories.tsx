/**
 * Storybook stories — LyricsAssistantSheet component
 *
 * Demonstrates:
 * - Empty chat
 * - With preview suggestion
 * - Collapsed preview
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LyricsAssistantSheet } from "./LyricsAssistantSheet";

const meta: Meta<typeof LyricsAssistantSheet> = {
  title: "Lyrics/AssistantSheet",
  component: LyricsAssistantSheet,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Bottom sheet for AI lyrics assistant with live preview and apply functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "onOpenChange" },
    currentText: { control: "text" },
    onApply: { action: "onApply" },
  },
};

export default meta;
type Story = StoryObj<typeof LyricsAssistantSheet>;

export const EmptyChat: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    currentText: "",
    onApply: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state with no current text.",
      },
    },
  },
};

export const WithPreviewSuggestion: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    currentText: `[Verse]
Line 1
Line 2
[Chorus]
Chorus line`,
    onApply: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Shows current lyrics preview above chat interface.",
      },
    },
  },
};

export const LongPreview: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    currentText: `[Intro]
Instrumental intro...

[Verse 1]
Walking down the street tonight
City lights are shining bright
Everything feels alright
When you're by my side

[Verse 2]
Stars are dancing in the sky
Dreams are flying high
We could touch the clouds
If we just try

[Chorus]
Oh, we're flying high
Reaching for the sky
Nothing's gonna stop us now
We're infinite, we're free

[Verse 3]
World is spinning round and round
Music is the only sound
Lost in this moment
Forever bound

[Bridge]
Take my hand, let's fly away
To a place where we can stay
No more fears, no more doubts
Just love, just now

[Chorus]
Oh, we're flying high
Reaching for the sky
Nothing's gonna stop us now
We're infinite, we're free

[Outro]
Flying high...`,
    onApply: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Long lyrics with scrollable preview.",
      },
    },
  },
};
