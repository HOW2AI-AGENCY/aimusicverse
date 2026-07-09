import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

const queryClient = new QueryClient();

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(MemoryRouter, null, React.createElement(Story)),
      ),
  ],
};

export default preview;
