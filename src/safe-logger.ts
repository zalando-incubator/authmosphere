import { Logger, LogFunction } from './types';

const voidLogging: LogFunction = () => undefined;

const loggerOrNoop = (logfunction?: LogFunction): LogFunction =>
  logfunction ? logfunction : voidLogging;

const safeLogger = (logger?: Logger): Logger => {
  const _safeLogger = {
    ...logger,
    info: loggerOrNoop(logger?.info),
    debug: loggerOrNoop(logger?.debug),
    error: loggerOrNoop(logger?.error),
    fatal: loggerOrNoop(logger?.fatal),
    trace: loggerOrNoop(logger?.trace),
    warn: loggerOrNoop(logger?.warn),
  };

  if (logger) {
    Object.setPrototypeOf(_safeLogger, Object.getPrototypeOf(logger));
  }

  return _safeLogger;
};

export { safeLogger };
