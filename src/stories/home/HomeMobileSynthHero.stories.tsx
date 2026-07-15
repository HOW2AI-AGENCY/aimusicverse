/**
 * Storybook story — HomeMobileSynthHero
 *
 * Cyber-synth mobile hero (violet #7C5CFF + mint #22E4A7, Bricolage Grotesque).
 * Renders only on mobile. Story wraps in GuestModeProvider because useUserCredits
 * → useGuestMode throws without it; in the Storybook iframe isDevEnvironment() is
 * true so queries stay disabled-ish and the chip strip renders with balance 0.
 */
import type { Meta, StoryObj } from "@storybook/react";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { HomeMobileSynthHero } from "@/components/home/HomeMobileSynthHero";

const withGuestMode = (Story: () => React.ReactNode) => (
  <div className="mx-auto w-full max-w-md">
    <GuestModeProvider>
      <Story />
    </GuestModeProvider>
  </div>
);

const meta: Meta<typeof HomeMobileSynthHero> = {
  title: "Home/HomeMobileSynthHero",
  component: HomeMobileSynthHero,
  parameters: {
    layout: "padded",
    viewport: { defaultViewport: "mobile1" },
  },
  tags: ["autodocs"],
  decorators: [withGuestMode],
};

export default meta;
type Story = StoryObj<typeof HomeMobileSynthHero>;

export const Default: Story = {
  args: {
    onCreateClick: (prompt?: string) => alert(`Create: ${prompt ?? "(пустой промпт)"}`),
  },
};
