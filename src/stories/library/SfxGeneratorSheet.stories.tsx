/**
 * Sprint 053-B9: Storybook stories for SfxGeneratorSheet.
 *
 * Stories are smoke-renders (no MSW yet). Real authentication is unavailable
 * in Storybook, so useSunoSounds will produce no data and the sheet renders
 * its idle form. To exercise state machines, run the unit tests.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SfxGeneratorSheet } from "@/components/library/SfxGeneratorSheet";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof SfxGeneratorSheet> = {
  title: "Library/SfxGeneratorSheet",
  component: SfxGeneratorSheet,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SfxGeneratorSheet>;

function SheetWithTrigger() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background p-4">
      <Button onClick={() => setOpen(true)}>Open SFX Generator</Button>
      <SfxGeneratorSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

export const Default: Story = {
  render: () => <SheetWithTrigger />,
};

export const ClosedByDefault: Story = {
  render: () => {
    function StoryInner() {
      const [open, setOpen] = useState(false);
      return (
        <div className="min-h-screen bg-background p-4">
          <Button onClick={() => setOpen(true)}>Open SFX Generator</Button>
          <SfxGeneratorSheet open={open} onOpenChange={setOpen} />
        </div>
      );
    }
    return <StoryInner />;
  },
};
