const createLogger = (_defaultContext: Record<string, unknown> = {}) => {
  const api = {
    context: _defaultContext,
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    startTimer: () => {
      const start = performance.now();
      return () => performance.now() - start;
    },
    group: (_label: string, callback?: () => void) => {
      if (callback) {
        callback();
      }
    },
    table: () => {},
    child: (childContext: Record<string, unknown> = {}) =>
      createLogger({ ..._defaultContext, ...childContext }),
  };

  return api;
};

export const logger = createLogger();
