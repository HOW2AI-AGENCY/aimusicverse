import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: { defaultChecked: false },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: false },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Уведомления</Label>
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      publicProfile: true,
      notifications: false,
      autoplay: true,
      highQuality: false,
    });
    const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));
    return (
      <div className="w-72 space-y-4">
        {[
          { key: "publicProfile" as const, label: "Публичный профиль", desc: "Ваши треки видны всем" },
          { key: "notifications" as const, label: "Уведомления", desc: "Push-уведомления в Telegram" },
          { key: "autoplay" as const, label: "Автовоспроизведение", desc: "Следующий трек в очереди" },
          { key: "highQuality" as const, label: "Высокое качество", desc: "320 kbps (больше трафика)" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={settings[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    );
  },
};
