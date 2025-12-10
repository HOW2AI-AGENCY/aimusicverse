const createLogger = () => {
  const api = {
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
    child: () => createLogger(),
  };

  return api;
};

export const logger = createLogger();
