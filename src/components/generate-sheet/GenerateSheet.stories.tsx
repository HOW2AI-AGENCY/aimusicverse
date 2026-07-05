/**
 * Storybook stories — GenerateSheet component
 *
 * Demonstrates:
 * - Default render
 * - Simple mode
 * - Custom mode
 * - Loading state
 * - Disabled state
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GenerateSheet } from "@/components/GenerateSheet";

const meta: Meta<typeof GenerateSheet> = {
  title: "Generate/Sheet",
  component: GenerateSheet,
  decorators: [
    (Story) => (
      <div style={{ height: "100dvh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Main generation sheet with form validation and Telegram integration.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "onOpenChange" },
  },
};

export default meta;
type Story = StoryObj<typeof GenerateSheet>;

export const Default: Story = {
  args: { open: true, onOpenChange: () => {} },
};

export const SimpleMode: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Simplified mode with basic generation options only.",
      },
    },
  },
};

export const CustomMode: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Full custom mode with lyrics, advanced settings, and all options.",
      },
    },
  },
};

export const Loading: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Loading state during generation.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    docs: {
      description: {
        story: "Disabled state when form is incomplete.",
      },
    },
  },
};

/**
 * Phase C2: Responsive mobile viewports
 *
 * Tests GenerateSheet on various mobile screen sizes to ensure
 * proper layout and touch interactions on small screens.
 */
export const MobileViewports: Story = {
  name: "Responsive - Mobile viewports",
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    viewport: {
      viewports: [
        "iphone12_mini", // 375x667 - smallest iPhone
        "iphone12", // 390x844 - standard iPhone
        "pixel5", // 393x851 - Android
      ],
    },
    docs: {
      description: {
        story: "GenerateSheet on mobile devices - keyboard awareness, safe areas, touch targets.",
      },
    },
  },
};

/**
 * Phase C2: Responsive desktop layout
 *
 * Tests GenerateSheet on larger screens where the sheet appears
 * as a centered dialog with max-width constraints.
 */
export const DesktopViewports: Story = {
  name: "Responsive - Desktop layout",
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    viewport: {
      viewports: [
        "laptop", // 1024x768 - small laptop
        "desktop", // 1280x800 - desktop
      ],
    },
    docs: {
      description: {
        story: "GenerateSheet on desktop - centered sheet with max-width and proper spacing.",
      },
    },
  },
};
