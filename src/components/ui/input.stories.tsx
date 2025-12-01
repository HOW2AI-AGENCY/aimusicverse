import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Mail } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Password: Story = {
  args: {
    ...Default.args,
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <label htmlFor="email">Email</label>
      <Input {...args} id="email" placeholder="Email" />
    </div>
  ),
  args: {
    type: 'email',
  },
};

export const WithButton: Story = {
  render: (args) => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input {...args} placeholder="Recipient's username" />
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        @
      </button>
    </div>
  ),
  args: {
    type: 'text',
  },
};

export const Search: Story = {
    args: {
      ...Default.args,
      type: 'search',
      placeholder: 'Search...',
    },
  };
