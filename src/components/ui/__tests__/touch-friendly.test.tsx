/**
 * Unit tests for Touch-Friendly Components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TouchTarget,
  TouchIconButton,
  SwipeableCard,
  triggerHaptic,
  useHaptics,
} from '../touch-friendly';
import { Heart, Star, Trash } from 'lucide-react';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock framer-motion
jest.mock('@/lib/motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  useReducedMotion: () => false,
}));

describe('TouchTarget', () => {
  it('should render children', () => {
    render(
      <TouchTarget>
        <button>Click me</button>
      </TouchTarget>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should apply minimum size for touch accessibility', () => {
    const { container } = render(
      <TouchTarget minSize={48}>
        <span>Touch target</span>
      </TouchTarget>
    );

    const touchArea = container.querySelector('[aria-hidden="true"]');
    expect(touchArea).toHaveStyle({ minWidth: '48px', minHeight: '48px' });
  });
});

describe('TouchIconButton', () => {
  it('should render icon', () => {
    render(<TouchIconButton icon={<Heart data-testid="heart-icon" />} label="Like" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText('Like')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onClick = jest.fn();
    render(<TouchIconButton icon={<Star />} label="Favorite" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TouchIconButton icon={<Trash />} label="Delete" disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply size variants', () => {
    const { rerender } = render(
      <TouchIconButton icon={<Heart />} label="Small" size="sm" />
    );

    let button = screen.getByRole('button');
    expect(button.className).toContain('min-w-[44px]');

    rerender(<TouchIconButton icon={<Heart />} label="Large" size="lg" />);
    button = screen.getByRole('button');
    expect(button.className).toContain('min-w-[56px]');
  });

  it('should apply variant styles', () => {
    render(<TouchIconButton icon={<Heart />} label="Solid" variant="solid" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary');
  });
});

describe('SwipeableCard', () => {
  it('should render children', () => {
    render(
      <SwipeableCard>
        <div>Card content</div>
      </SwipeableCard>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should show left action element', () => {
    render(
      <SwipeableCard
        leftAction={<div data-testid="left-action">Left</div>}
        threshold={50}
      >
        <div>Swipeable</div>
      </SwipeableCard>
    );

    expect(screen.getByTestId('left-action')).toBeInTheDocument();
  });

  it('should show right action element', () => {
    render(
      <SwipeableCard
        rightAction={<div data-testid="right-action">Right</div>}
        threshold={50}
      >
        <div>Swipeable</div>
      </SwipeableCard>
    );

    expect(screen.getByTestId('right-action')).toBeInTheDocument();
  });
});

describe('triggerHaptic', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
  });

  it('should trigger light haptic', () => {
    triggerHaptic('light');
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('should trigger medium haptic', () => {
    triggerHaptic('medium');
    expect(mockVibrate).toHaveBeenCalledWith(20);
  });

  it('should trigger heavy haptic', () => {
    triggerHaptic('heavy');
    expect(mockVibrate).toHaveBeenCalledWith(40);
  });

  it('should trigger success pattern', () => {
    triggerHaptic('success');
    expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('should trigger error pattern', () => {
    triggerHaptic('error');
    expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50]);
  });
});

describe('useHaptics', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
  });

  it('should return haptic trigger functions', () => {
    const TestComponent = () => {
      const { light, medium, heavy, success, error } = useHaptics();

      return (
        <div>
          <button onClick={light}>Light</button>
          <button onClick={medium}>Medium</button>
          <button onClick={heavy}>Heavy</button>
          <button onClick={success}>Success</button>
          <button onClick={error}>Error</button>
        </div>
      );
    };

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Light'));
    expect(mockVibrate).toHaveBeenCalledWith(10);

    fireEvent.click(screen.getByText('Success'));
    expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);
  });
});
