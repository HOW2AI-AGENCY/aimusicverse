/**
 * Storybook story — MobileFullscreenPlayer
 */
import type { Meta, StoryObj } from "@storybook/react";
import { MobileFullscreenPlayer } from "@/components/player/MobileFullscreenPlayer";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof MobileFullscreenPlayer> = {
  title: "Player/MobileFullscreenPlayer",
  component: MobileFullscreenPlayer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-96 mx-auto h-[600px] relative">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileFullscreenPlayer>;

export const Default: Story = {};
