/**
 * Structured logging utility for Supabase Edge Functions
 * 
 * Features:
 * - Consistent log format with timestamps
 * - Log levels (debug, info, warn, error)
 * - Context support for structured data
 * - Sensitive data redaction
 * - Request tracing with correlation IDs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'authorization',
  'telegram_id', 'chat_id', 'api_key', 'apikey', 'bearer'
];

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatMessage(level: LogLevel, functionName: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const emoji = {
    debug: '🔍',
    info: '📋',
    warn: '⚠️',
    error: '❌'
  }[level];
  
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${functionName}]`;
  const sanitizedContext = sanitizeContext(context);
  
  if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
    return `${emoji} ${prefix} ${message} ${JSON.stringify(sanitizedContext)}`;
  }
  
  return `${emoji} ${prefix} ${message}`;
}

export function createLogger(functionName: string) {
  return {
    debug(message: string, context?: LogContext): void {
      console.log(formatMessage('debug', functionName, message, context));
    },
    
    info(message: string, context?: LogContext): void {
      console.log(formatMessage('info', functionName, message, context));
    },
    
    warn(message: string, context?: LogContext): void {
      console.warn(formatMessage('warn', functionName, message, context));
    },
    
    error(message: string, error?: Error | unknown, context?: LogContext): void {
      const errorContext: LogContext = { ...context };
      
      if (error instanceof Error) {
        errorContext.errorName = error.name;
        errorContext.errorMessage = error.message;
        errorContext.errorStack = error.stack?.split('\n').slice(0, 3).join('\n');
      } else if (error !== undefined) {
        errorContext.errorValue = String(error);
      }
      
      console.error(formatMessage('error', functionName, message, errorContext));
    },
    
    /**
     * Log request start with method and path
     */
    request(method: string, path?: string, context?: LogContext): void {
      console.log(formatMessage('info', functionName, `${method} ${path || '/'}`, context));
    },
    
    /**
     * Log successful response
     */
    success(message: string, context?: LogContext): void {
      console.log(formatMessage('info', functionName, `✅ ${message}`, context));
    },
    
    /**
     * Log API call to external service
     */
    apiCall(service: string, endpoint: string, context?: LogContext): void {
      console.log(formatMessage('info', functionName, `API Call: ${service} -> ${endpoint}`, context));
    },
    
    /**
     * Log database operation
     */
    db(operation: string, table: string, context?: LogContext): void {
      console.log(formatMessage('debug', functionName, `DB: ${operation} on ${table}`, context));
    }
  };
}

export type Logger = ReturnType<typeof createLogger>;
