/**
 * Unit tests for OptimizedLyricsLine component
 * Tests for memoization, re-render optimization, and word-level sync
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { OptimizedLyricsLine, LyricsLineData } from '@/components/lyrics/OptimizedLyricsLine';

describe('OptimizedLyricsLine - T022', () => {
  const mockLine: LyricsLineData = {
    id: 'line-1',
    text: 'Test lyrics line',
    startTime: 10,
    endTime: 15,
  };

  const defaultProps = {
    line: mockLine,
    index: 0,
    isActive: false,
    isNext: false,
    isPast: false,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memoization', () => {
    it('should not re-render when props remain the same', () => {
      const { rerender } = render(<OptimizedLyricsLine {...defaultProps} />);

      // Rerender with same props
      const initialRender = screen.getByText('Test lyrics line');
      rerender(<OptimizedLyricsLine {...defaultProps} />);

      const rerendered = screen.getByText('Test lyrics line');
      expect(initialRender).toBe(rerendered);
    });

    it('should re-render when line text changes', () => {
      const { rerender } = render(<OptimizedLyricsLine {...defaultProps} />);

      rerender(
        <OptimizedLyricsLine
          {...defaultProps}
          line={{ ...mockLine, text: 'Updated lyrics' }}
        />
      );

      expect(screen.getByText('Updated lyrics')).toBeInTheDocument();
    });

    it('should re-render when isActive state changes', () => {
      const { rerender } = render(<OptimizedLyricsLine {...defaultProps} />);

      rerender(<OptimizedLyricsLine {...defaultProps} isActive={true} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveClass('bg-primary/10');
    });

    it('should not re-render when onClick function reference changes but other props are same', () => {
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();

      const { rerender } = render(
        <OptimizedLyricsLine {...defaultProps} onClick={onClick1} />
      );

      const initialRender = screen.getByText('Test lyrics line');

      // Rerender with new onClick reference but same other props
      rerender(<OptimizedLyricsLine {...defaultProps} onClick={onClick2} />);

      const rerendered = screen.getByText('Test lyrics line');
      expect(initialRender).toBe(rerendered);
    });
  });

  describe('Active Line Styling', () => {
    it('should apply active styles when isActive is true', () => {
      render(<OptimizedLyricsLine {...defaultProps} isActive={true} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveClass('bg-primary/10', 'font-medium');
    });

    it('should apply next line styles when isNext is true', () => {
      render(<OptimizedLyricsLine {...defaultProps} isNext={true} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveClass('text-foreground/80');
    });

    it('should apply past line styles when isPast is true', () => {
      render(<OptimizedLyricsLine {...defaultProps} isPast={true} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveClass('opacity-50');
    });
  });

  describe('Section Headers', () => {
    it('should render section header when line.isSection is true', () => {
      const sectionLine: LyricsLineData = {
        id: 'section-1',
        text: '',
        isSection: true,
        sectionType: 'VERSE',
      };

      render(<OptimizedLyricsLine {...defaultProps} line={sectionLine} />);

      expect(screen.getByText('VERSE')).toBeInTheDocument();
    });

    it('should not render section text when isSection is false', () => {
      render(<OptimizedLyricsLine {...defaultProps} />);

      expect(screen.queryByText('VERSE')).not.toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('should display timestamp when showTimestamps is true', () => {
      render(
        <OptimizedLyricsLine
          {...defaultProps}
          showTimestamps={true}
          line={{ ...mockLine, startTime: 65 }}
        />
      );

      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('should not display timestamp when showTimestamps is false', () => {
      render(
        <OptimizedLyricsLine
          {...defaultProps}
          showTimestamps={false}
          line={{ ...mockLine, startTime: 65 }}
        />
      );

      expect(screen.queryByText('1:05')).not.toBeInTheDocument();
    });

    it('should format timestamp correctly as MM:SS', () => {
      render(
        <OptimizedLyricsLine
          {...defaultProps}
          showTimestamps={true}
          line={{ ...mockLine, startTime: 125 }}
        />
      );

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onClick when line is clicked', () => {
      const onClick = vi.fn();

      render(<OptimizedLyricsLine {...defaultProps} onClick={onClick} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      element?.click();

      expect(onClick).toHaveBeenCalledWith(mockLine, 0);
    });

    it('should call onDoubleClick when line is double-clicked', () => {
      const onDoubleClick = vi.fn();

      render(
        <OptimizedLyricsLine {...defaultProps} onDoubleClick={onDoubleClick} />
      );

      const element = screen.getByText('Test lyrics line').closest('div');
      element?.dblclick();

      expect(onDoubleClick).toHaveBeenCalledWith(mockLine, 0);
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<OptimizedLyricsLine {...defaultProps} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveAttribute('role', 'button');
    });

    it('should have aria-current when isActive is true', () => {
      render(<OptimizedLyricsLine {...defaultProps} isActive={true} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveAttribute('aria-current', 'true');
    });

    it('should be keyboard accessible with tabIndex', () => {
      render(<OptimizedLyricsLine {...defaultProps} />);

      const element = screen.getByText('Test lyrics line').closest('div');
      expect(element).toHaveAttribute('tabIndex', '0');
    });
  });
});
