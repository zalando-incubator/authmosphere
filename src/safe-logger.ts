import { Logger, LogFunction, LogLevel } from './types';

const voidLogging: LogFunction = () => undefined;

const isLogFunction = (value: unknown): value is LogFunction =>
  typeof value === 'function';

const loggerOrNoop = (logLevel: LogLevel, logger?: Logger): LogFunction => {
  if (logger && isLogFunction(logger[logLevel])) {
    // not returning here `logger[logLevel]` to keep logger context (this)
    // alternative solution could be returning `logger[logLevel].bind(logger)`
    return (message: string, ...args: unknown[]) =>
      logger[logLevel](message, ...args);
  }
  return voidLogging;
};

const safeLogger = (logger?: Logger): Logger => ({
  ...logger,
  info: loggerOrNoop(LogLevel.info, logger),
  debug: loggerOrNoop(LogLevel.debug, logger),
  error: loggerOrNoop(LogLevel.error, logger),
  fatal: loggerOrNoop(LogLevel.fatal, logger),
  trace: loggerOrNoop(LogLevel.trace, logger),
  warn: loggerOrNoop(LogLevel.warn, logger),
});

export { safeLogger };
