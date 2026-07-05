import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

/**
 * Sprint 055-B3: BottomNavigation with hint positioning
 *
 * Stories demonstrating the first-time user hint ("Создайте первый трек здесь! ✨")
 * positioned above the FAB to avoid overlapping content on small screens.
 *
 * Key fix: hint uses `-top-12 -translate-y-full` instead of `bottom-16` to float
 * above the FAB button without blocking navigation elements above it.
 */

const meta: Meta<typeof BottomNavigation> = {
  title: "Navigation/BottomNavigation",
  component: BottomNavigation,
  parameters: {
    layout: "fullscreen",
    viewport: {
      // Test on small mobile screens where overlap is most likely
      defaultViewport: "iphone12_mini",
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/"]}>
          {/* Mock minimal page structure */}
          <div className="min-h-screen pb-20 bg-background">
            <div className="p-4 space-y-4">
              <h1 className="text-2xl font-bold">Bottom Navigation Demo</h1>
              <p className="text-muted-foreground">
                The navigation bar appears below. Hint should be visible above the center FAB button.
              </p>
            </div>
          </div>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

/**
 * Default state: No hint shown (user has seen it before)
 */
export const Default: Story = {
  name: "Default - No hint",
  parameters: {
    localStorage: {
      musicverse_seen_create_hint: "true",
    },
  },
};

/**
 * First-time user: Hint visible above FAB
 *
 * Demonstrates Sprint 055-B3 fix: hint positioned with `-top-12 -translate-y-full`
 * to avoid overlapping content above the navigation bar.
 */
export const WithHint: Story = {
  name: "First-time user - Hint visible",
  parameters: {
    localStorage: {
      // Clear the hint flag to show it
      musicverse_seen_create_hint: null,
    },
    viewport: {
      // Test on various small screens
      viewports: ["iphone12_mini", "iphone12", "pixel5"],
    },
  },
  render: () => {
    // Force hint to show immediately by clearing localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("musicverse_seen_create_hint");
    }
    return <BottomNavigation />;
  },
};

/**
 * Active generation: Badge shown on FAB
 *
 * Tests the interaction between hint visibility and active generation badges.
 * The badge should appear in the top-right corner of the FAB.
 */
export const ViewportTest: Story = {
  name: "Viewport compatibility test",
  parameters: {
    viewport: {
      viewports: [
        "iphone12_mini", // 375x667 - smallest
        "iphone12", // 390x844 - common
        "pixel5", // 393x851 - Android
        "ipadmini", // 768x1024 - tablet
      ],
    },
  },
  render: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("musicverse_seen_create_hint");
    }
    return <BottomNavigation />;
  },
};
