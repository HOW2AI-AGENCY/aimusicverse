/**
 * Jest test setup file
 * Configures testing environment and global mocks
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Telegram WebApp
Object.defineProperty(window, 'Telegram', {
  writable: true,
  value: {
    WebApp: {
      ready: jest.fn(),
      expand: jest.fn(),
      close: jest.fn(),
      MainButton: {
        show: jest.fn(),
        hide: jest.fn(),
        setText: jest.fn(),
        onClick: jest.fn(),
        offClick: jest.fn(),
      },
      BackButton: {
        show: jest.fn(),
        hide: jest.fn(),
        onClick: jest.fn(),
        offClick: jest.fn(),
      },
      HapticFeedback: {
        impactOccurred: jest.fn(),
        notificationOccurred: jest.fn(),
        selectionChanged: jest.fn(),
      },
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
        },
      },
      colorScheme: 'dark',
      themeParams: {},
      viewportHeight: 800,
      viewportStableHeight: 800,
      isExpanded: true,
      platform: 'tdesktop',
    },
  },
});

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 0,
  paused: true,
  volume: 1,
  muted: false,
}));

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    getByteFrequencyData: jest.fn(),
    fftSize: 256,
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
}));

// Suppress console errors in tests (optional, comment out for debugging)
const originalError = console.error;
console.error = (...args: any[]) => {
  // Filter out known React testing warnings
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('act(...)') || args[0].includes('Warning:'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
