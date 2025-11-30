import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import '@testing-library/jest-dom';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch an error and display the fallback UI', () => {
    // Suppress console.error output for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByText('Произошла ошибка при загрузке приложения. Попробуйте перезагрузить страницу.')).toBeInTheDocument();
    expect(screen.queryByText('Детали ошибки')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should display error details in development mode', () => {
    // Suppress console.error output for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByText('Произошла ошибка при загрузке приложения. Попробуйте перезагрузить страницу.')).toBeInTheDocument();
    expect(screen.getByText('Детали ошибки')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Restore console.error and NODE_ENV
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });
});
