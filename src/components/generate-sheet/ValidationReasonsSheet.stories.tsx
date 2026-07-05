/**
 * Storybook stories — ValidationReasonsSheet component
 *
 * Demonstrates:
 * - Errors only
 * - Errors with warnings
 * - All warnings (no errors)
 * - Empty state (valid)
 */
import type { Meta, StoryObj } from "@storybook/react";
import { ValidationReasonsSheet } from "./ValidationReasonsSheet";
import type { ValidationReason } from "@/hooks/generation/useGenerateSheetValidation";

const meta: Meta<typeof ValidationReasonsSheet> = {
  title: "Generate/ValidationReasonsSheet",
  component: ValidationReasonsSheet,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Bottom sheet showing validation errors and warnings with deep links.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onOpenChange: { action: "onOpenChange" },
    reasons: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof ValidationReasonsSheet>;

const errorReasons: ValidationReason[] = [
  {
    field: "style",
    severity: "error",
    message: "style.empty",
    messageRu: "Опишите стиль трека",
  },
  {
    field: "credits",
    severity: "error",
    message: "credits.insufficient",
    messageRu: "Недостаточно кредитов (нужно 8, доступно 3)",
  },
];

const errorAndWarningReasons: ValidationReason[] = [
  {
    field: "style",
    severity: "error",
    message: "style.empty",
    messageRu: "Опишите стиль трека",
  },
  {
    field: "title",
    severity: "warning",
    message: "title.empty",
    messageRu: "Название не заполнено",
  },
];

const warningReasons: ValidationReason[] = [
  {
    field: "title",
    severity: "warning",
    message: "title.empty",
    messageRu: "Название не заполнено",
  },
  {
    field: "lyrics",
    severity: "warning",
    message: "lyrics.empty_with_vocals",
    messageRu: "Вокал включён, но текст пустой",
  },
];

export const ErrorsOnly: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: errorReasons,
  },
  parameters: {
    docs: {
      description: {
        story: "Only errors - prevents generation.",
      },
    },
  },
};

export const ErrorsPlusWarnings: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: errorAndWarningReasons,
  },
  parameters: {
    docs: {
      description: {
        story: "Mixed errors and warnings - errors prevent generation.",
      },
    },
  },
};

export const WarningsOnly: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: warningReasons,
  },
  parameters: {
    docs: {
      description: {
        story: "Only warnings - allows generation but shows cautions.",
      },
    },
  },
};

export const Valid: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: [],
  },
  parameters: {
    docs: {
      description: {
        story: "No validation issues - ready to generate.",
      },
    },
  },
};

/**
 * Phase C3: Keyboard navigation
 *
 * Demonstrates keyboard accessibility:
 * - Tab navigation through validation reasons
 * - Enter/Space to trigger deep links
 * - Focus indicators on interactive elements
 */
export const KeyboardNavigation: Story = {
  name: "Accessibility - Keyboard navigation",
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: errorAndWarningReasons,
  },
  parameters: {
    docs: {
      description: {
        story: "Keyboard users can tab through validation reasons and trigger deep links with Enter/Space.",
      },
    },
  },
};

/**
 * Phase C3: Screen reader support
 *
 * Demonstrates ARIA attributes and semantic markup:
 * - role="alert" for error messages
 * - aria-live regions for dynamic updates
 * - Proper heading hierarchy
 */
export const ScreenReaderSupport: Story = {
  name: "Accessibility - Screen reader support",
  args: {
    open: true,
    onOpenChange: () => {},
    reasons: errorReasons,
  },
  parameters: {
    docs: {
      description: {
        story: "Screen readers announce validation errors with proper ARIA live regions and semantic markup.",
      },
    },
  },
};
