export const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  startTimer: () => () => 0,
  group: (_label: string, callback?: () => void) => {
    if (callback) {
      callback();
    }
  },
  table: () => {},
  child: () => logger,
};
