/**
 * Storybook story — BottomNavigation
 */
import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation } from "@/components/BottomNavigation";
const meta: Meta<typeof BottomNavigation> = {
  title: "Navigation/BottomNavigation",
  component: BottomNavigation,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="fixed bottom-0 left-0 right-0">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};
