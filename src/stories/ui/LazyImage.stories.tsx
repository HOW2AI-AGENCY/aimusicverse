/**
 * 037-06: Storybook story — LazyImage component
 *
 * Demonstrates:
 * - Loading state (blur placeholder)
 * - Loaded state
 * - Error/fallback state
 * - Various aspect ratios
 */
import type { Meta, StoryObj } from "@storybook/react";
import { LazyImage } from "@/components/ui/lazy-image";

const meta: Meta<typeof LazyImage> = {
  title: "UI/LazyImage",
  component: LazyImage,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Optimized image component with blur placeholder, lazy loading, and shimmer animation. All images in the app MUST use this component per CLAUDE.md rules.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    src: { control: "text" },
    alt: { control: "text" },
    className: { control: "text" },
    width: { control: "number" },
    height: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof LazyImage>;

export const Default: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    alt: "Vinyl record on a table",
    className: "rounded-lg",
    width: 300,
    height: 300,
  },
};

export const WithAspectRatio: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=300&fit=crop",
    alt: "Music concert crowd",
    className: "rounded-lg aspect-video object-cover",
    width: 600,
    height: 300,
  },
  render: (args) => (
    <div className="w-[400px]">
      <LazyImage {...args} />
    </div>
  ),
};

export const ErrorFallback: Story = {
  args: {
    src: "https://invalid-url-that-does-not-exist.com/image.jpg",
    alt: "This image will fail to load",
    className: "rounded-lg",
    width: 300,
    height: 300,
  },
};

export const SmallThumbnail: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=100&h=100&fit=crop",
    alt: "Small album art",
    className: "rounded-full",
    width: 64,
    height: 64,
  },
};

export const TrackCover: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    alt: "Track cover art",
    className: "rounded-lg shadow-lg",
    width: 200,
    height: 200,
  },
};
