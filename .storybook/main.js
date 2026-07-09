/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    const path = require('path');
    const mockDir = path.resolve(__dirname, 'mocks');
    // Mock context modules for Storybook
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/contexts/AuthContext': path.join(mockDir, 'AuthContext.tsx'),
      '@/contexts/TelegramContext': path.join(mockDir, 'TelegramContext.tsx'),
      '@/contexts/telegram/TelegramProvider': path.join(mockDir, 'TelegramContext.tsx'),
      '@/contexts/telegram/index': path.join(mockDir, 'TelegramContext.tsx'),
      '@/contexts/telegram': path.join(mockDir, 'TelegramContext.tsx'),
      '@/contexts/ThemeContext': path.join(mockDir, 'ThemeContext.tsx'),
      '@/contexts/NotificationContext': path.join(mockDir, 'NotificationContext.tsx'),
      '@/hooks/useNotifications': path.join(mockDir, 'NotificationContext.tsx'),
    };
    return config;
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
