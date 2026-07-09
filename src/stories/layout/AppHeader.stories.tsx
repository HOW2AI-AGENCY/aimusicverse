/**
 * Storybook story — AppHeader
 */
import type { Meta, StoryObj } from "@storybook/react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BrowserRouter } from "react-router-dom";

const meta: Meta<typeof AppHeader> = {
  title: "Layout/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-full">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {
  args: {
    title: "Library",
  },
};

export const WithBackButton: Story = {
  args: {
    title: "Track Detail",
    showBack: true,
    onBack: () => alert("Back"),
  },
};
