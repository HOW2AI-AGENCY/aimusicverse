import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Heart } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Название карточки</CardTitle>
        <CardDescription>Описание карточки для пояснения содержимого.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Основное содержимое карточки.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>С кнопками</CardTitle>
        <CardDescription>Карточка с действиями в подвале.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Содержимое карточки.</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm">
          Отмена
        </Button>
        <Button size="sm">Подтвердить</Button>
      </CardFooter>
    </Card>
  ),
};

export const TrackCard: Story = {
  render: () => (
    <Card className="w-72">
      <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center">
        <Music className="w-12 h-12 text-white opacity-80" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Midnight Dreams</CardTitle>
            <CardDescription>Electronic • 3:42</CardDescription>
          </div>
          <Badge variant="secondary">Pop</Badge>
        </div>
      </CardHeader>
      <CardFooter className="pt-0 flex gap-2">
        <Button size="sm" className="flex-1">
          <Music className="w-3.5 h-3.5 mr-1" /> Слушать
        </Button>
        <Button size="sm" variant="outline">
          <Heart className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const StatCard: Story = {
  render: () => (
    <div className="flex gap-3">
      {[
        { label: "Треки", value: "128" },
        { label: "Плейлисты", value: "14" },
        { label: "Лайки", value: "2.4K" },
      ].map(({ label, value }) => (
        <Card key={label} className="flex-1 text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
