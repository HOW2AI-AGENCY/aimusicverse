/**
 * Unit tests for AppError classes and utilities
 */

import {
  AppError,
  NetworkError,
  APIError,
  ValidationError,
  AudioError,
  GenerationError,
  InsufficientCreditsError,
  StorageError,
  ErrorCode,
  ErrorSeverity,
  RecoveryStrategy,
  ok,
  err,
  tryCatch,
  tryCatchSync,
  toAppError,
  isErrorType,
  hasErrorCode,
  retryWithBackoff,
} from '../AppError';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new AppError('Test error', ErrorCode.UNKNOWN_ERROR, 500, { key: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context).toEqual({ key: 'value' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use defaults when options not provided', () => {
      const error = new AppError('Test error');

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.metadata.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.metadata.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new AppError('Test error', ErrorCode.NETWORK_ERROR, undefined, { url: 'https://api.example.com' });

      const json = error.toJSON();

      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(json.context).toEqual({ url: 'https://api.example.com' });
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const error = new NetworkError('Connection failed');
      expect(error.isRetryable()).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new ValidationError('Invalid input');
      expect(error.isRetryable()).toBe(false);
    });
  });
});

describe('NetworkError', () => {
  it('should create network error with correct defaults', () => {
    const error = new NetworkError('Connection failed');

    expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(error.isRetryable()).toBe(true);
    expect(error.metadata.recoveryStrategy).toBe(RecoveryStrategy.RETRY);
  });

  it('should accept context', () => {
    const error = new NetworkError('Request failed', { statusCode: 500 });

    expect(error.context?.statusCode).toBe(500);
  });

  it('should return user-friendly message', () => {
    const error = new NetworkError('Failed to fetch');
    expect(error.toUserMessage()).toContain('сети');
  });
});

describe('APIError', () => {
  it('should create API error with status code', () => {
    const error = new APIError('API request failed', 404);

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.isRetryable()).toBe(false);
  });

  it('should mark 5xx errors as retryable', () => {
    const error = new APIError('Server error', 503);

    expect(error.code).toBe(ErrorCode.SERVER_ERROR);
    expect(error.isRetryable()).toBe(true);
    expect(error.metadata.recoveryStrategy).toBe(RecoveryStrategy.RETRY_BACKOFF);
  });

  it('should handle rate limit errors', () => {
    const error = new APIError('Too many requests', 429);
    expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
    expect(error.toUserMessage()).toContain('лимит');
  });
});

describe('ValidationError', () => {
  it('should create validation error with errors array', () => {
    const error = new ValidationError('Validation failed', [
      'Invalid email format',
      'Password too short',
    ]);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.errors).toEqual([
      'Invalid email format',
      'Password too short',
    ]);
  });

  it('should create validation error with field', () => {
    const error = new ValidationError('Invalid email', [], 'email');
    expect(error.field).toBe('email');
  });
});

describe('AudioError', () => {
  it('should create audio error with correct code', () => {
    const error = new AudioError('Playback failed');

    expect(error.code).toBe(ErrorCode.AUDIO_PLAYBACK_ERROR);
  });

  it('should accept specific audio error codes', () => {
    const error = new AudioError('Context error', ErrorCode.AUDIO_CONTEXT_ERROR);
    expect(error.code).toBe(ErrorCode.AUDIO_CONTEXT_ERROR);
  });
});

describe('GenerationError', () => {
  it('should create generation error with correct code', () => {
    const error = new GenerationError('Generation failed');

    expect(error.code).toBe(ErrorCode.GENERATION_ERROR);
    expect(error.isRetryable()).toBe(true);
  });
});

describe('InsufficientCreditsError', () => {
  it('should create insufficient credits error', () => {
    const error = new InsufficientCreditsError(10, 5);

    expect(error.code).toBe(ErrorCode.INSUFFICIENT_CREDITS);
    expect(error.required).toBe(10);
    expect(error.available).toBe(5);
    expect(error.metadata.recoveryStrategy).toBe(RecoveryStrategy.MANUAL);
  });
});

describe('StorageError', () => {
  it('should create storage error with correct code', () => {
    const error = new StorageError('Upload failed');

    expect(error.code).toBe(ErrorCode.STORAGE_ERROR);
  });

  it('should accept specific storage error codes', () => {
    const error = new StorageError('Quota exceeded', ErrorCode.QUOTA_EXCEEDED);
    expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
  });
});

describe('Result utilities', () => {
  describe('ok', () => {
    it('should create success result', () => {
      const result = ok(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });
  });

  describe('err', () => {
    it('should create error result', () => {
      const error = new AppError('Test', ErrorCode.UNKNOWN_ERROR);
      const result = err(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('tryCatch', () => {
    it('should return ok for successful promise', async () => {
      const result = await tryCatch(() => Promise.resolve(42));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should return err for rejected promise', async () => {
      const result = await tryCatch(() => Promise.reject(new Error('Failed')));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AppError);
      }
    });
  });

  describe('tryCatchSync', () => {
    it('should return ok for successful function', () => {
      const result = tryCatchSync(() => 42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should return err for throwing function', () => {
      const result = tryCatchSync(() => {
        throw new Error('Failed');
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AppError);
      }
    });
  });
});

describe('toAppError', () => {
  it('should return AppError as-is', () => {
    const error = new AppError('Test', ErrorCode.UNKNOWN_ERROR);
    const result = toAppError(error);

    expect(result).toBe(error);
  });

  it('should wrap Error in AppError', () => {
    const error = new Error('Test');
    const result = toAppError(error);

    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Test');
  });

  it('should wrap string in AppError', () => {
    const result = toAppError('Test message');

    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Test message');
  });

  it('should detect network errors from message', () => {
    const error = new Error('Failed to fetch');
    const result = toAppError(error);

    expect(result).toBeInstanceOf(NetworkError);
  });
});

describe('isErrorType', () => {
  it('should return true for matching error type', () => {
    const error = new NetworkError('Test');
    expect(error instanceof NetworkError).toBe(true);
  });

  it('should return false for non-matching error type', () => {
    const error = new NetworkError('Test');
    expect(error instanceof APIError).toBe(false);
  });
});

describe('hasErrorCode', () => {
  it('should return true for matching error code', () => {
    const error = new AppError('Test', ErrorCode.NETWORK_ERROR);
    expect(hasErrorCode(error, ErrorCode.NETWORK_ERROR)).toBe(true);
  });

  it('should return false for non-matching error code', () => {
    const error = new AppError('Test', ErrorCode.NETWORK_ERROR);
    expect(hasErrorCode(error, ErrorCode.API_ERROR)).toBe(false);
  });
});

describe('retryWithBackoff', () => {
  it('should succeed on first try', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 10,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      retryWithBackoff(fn, { maxRetries: 2, initialDelayMs: 10 })
    ).rejects.toThrow('Always fails');

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
