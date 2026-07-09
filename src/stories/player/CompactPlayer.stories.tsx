/**
 * Storybook story — CompactPlayer
 */
import type { Meta, StoryObj } from "@storybook/react";
import { CompactPlayer } from "@/components/player/CompactPlayer";
const meta: Meta<typeof CompactPlayer> = {
  title: "Player/CompactPlayer",
  component: CompactPlayer,
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
type Story = StoryObj<typeof CompactPlayer>;

export const Default: Story = {};
