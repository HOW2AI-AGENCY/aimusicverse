import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert className="w-80">
      <Info className="h-4 w-4" />
      <AlertTitle>Информация</AlertTitle>
      <AlertDescription>Это информационное сообщение для пользователя.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-80">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription>Не удалось создать трек. Попробуйте снова.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert className="w-80 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-500">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Успешно!</AlertTitle>
      <AlertDescription>Трек создан и добавлен в библиотеку.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert className="w-80 border-amber-500/50 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-500">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Внимание</AlertTitle>
      <AlertDescription>Лимит генераций на сегодня почти исчерпан.</AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Информация</AlertTitle>
        <AlertDescription>Обновление доступно.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>Что-то пошло не так.</AlertDescription>
      </Alert>
      <Alert className="border-emerald-500/50 [&>svg]:text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Готово</AlertTitle>
        <AlertDescription>Действие выполнено успешно.</AlertDescription>
      </Alert>
    </div>
  ),
};
