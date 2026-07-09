/**
 * Storybook story — CompactPlayer
 */
import type { Meta, StoryObj } from "@storybook/react";
import { CompactPlayer } from "@/components/player/CompactPlayer";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof CompactPlayer> = {
  title: "Player/CompactPlayer",
  component: CompactPlayer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="fixed bottom-0 left-0 right-0">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompactPlayer>;

export const Default: Story = {};
