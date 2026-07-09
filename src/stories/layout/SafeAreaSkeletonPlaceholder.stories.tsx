/**
 * Storybook story — SafeAreaSkeletonPlaceholder
 */
import type { Meta, StoryObj } from "@storybook/react";
import { SafeAreaSkeletonPlaceholder } from "@/components/layout/SafeAreaSkeletonPlaceholder";

const meta: Meta<typeof SafeAreaSkeletonPlaceholder> = {
  title: "Layout/SafeAreaSkeletonPlaceholder",
  component: SafeAreaSkeletonPlaceholder,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SafeAreaSkeletonPlaceholder>;

export const Default: Story = {};
