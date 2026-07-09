/**
 * Storybook story — MobileFullscreenPlayer
 */
import type { Meta, StoryObj } from "@storybook/react";
import { MobileFullscreenPlayer } from "@/components/player/MobileFullscreenPlayer";
const meta: Meta<typeof MobileFullscreenPlayer> = {
  title: "Player/MobileFullscreenPlayer",
  component: MobileFullscreenPlayer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 mx-auto h-[600px] relative">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileFullscreenPlayer>;

export const Default: Story = {};
