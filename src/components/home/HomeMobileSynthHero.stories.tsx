/**
 * Storybook stories — HomeMobileSynthHero
 *
 * Cyber-synth mobile home hero from the Neon Studio redesign (Sprint 065):
 * stat chips (credits + streak), violet-gradient prompt card, and a
 * "Продолжи создавать" continue-draft strip.
 *
 * Auth is provided by the Storybook mock (`.storybook/mocks/AuthContext.tsx`),
 * which resolves a signed-in user, so the chips and continue-strip render.
 * `useUserCredits` degrades gracefully to zeros without a live backend.
 */
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HomeMobileSynthHero } from "./HomeMobileSynthHero";

const PhoneFrame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      width: 390,
      maxWidth: "100%",
      margin: "0 auto",
      padding: 16,
      background: "#0A0B14",
      borderRadius: 24,
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof HomeMobileSynthHero> = {
  title: "Home/HomeMobileSynthHero",
  component: HomeMobileSynthHero,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
    docs: {
      description: {
        component:
          "Mobile-only home hero (renders only on mobile in the app). Locked palette: bg #0A0B14, surface #12142B, violet #7C5CFF, mint #22E4A7. Signed-in user comes from the Storybook auth mock.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onCreateClick: { action: "onCreateClick" },
  },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <Story />
      </PhoneFrame>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomeMobileSynthHero>;

export const Default: Story = {
  args: {
    onCreateClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Full hero for a signed-in user: stat chips, prompt card, and continue-draft strip. Typing a prompt and pressing “Создать” fires onCreateClick with the trimmed text.",
      },
    },
  },
};
