import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChipInput } from "@/components/ui/ChipInput";

const meta: Meta<typeof ChipInput> = {
  title: "UI/ChipInput",
  component: ChipInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChipInput>;

const GENRE_SUGGESTIONS = ["Pop", "Rock", "Jazz", "Electronic", "Hip-Hop", "Classical", "R&B", "Metal", "Folk"];

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <div className="w-80">
        <ChipInput value={value} onChange={setValue} placeholder="Добавить жанр..." />
      </div>
    );
  },
};

export const WithValues: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["Pop", "Electronic"]);
    return (
      <div className="w-80">
        <ChipInput value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithSuggestions: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["Pop"]);
    return (
      <div className="w-80">
        <ChipInput
          value={value}
          onChange={setValue}
          suggestions={GENRE_SUGGESTIONS}
          placeholder="Введите жанр..."
          label="Жанры"
        />
        <p className="text-xs text-muted-foreground mt-1">Попробуйте: Ro, Ja, El</p>
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["Мечтательный", "Лиричный"]);
    return (
      <div className="w-80">
        <ChipInput value={value} onChange={setValue} label="Настроение" placeholder="Добавить настроение..." />
      </div>
    );
  },
};

export const WithMaxChips: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["Pop", "Rock"]);
    return (
      <div className="w-80">
        <ChipInput
          value={value}
          onChange={setValue}
          maxChips={3}
          placeholder="Макс. 3 тега..."
          label={`Теги (${value.length}/3)`}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <ChipInput value={["Disabled", "Tags"]} onChange={() => {}} disabled label="Отключено" />
    </div>
  ),
};
