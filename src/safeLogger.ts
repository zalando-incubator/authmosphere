import {
  Logger,
  LogLevel
} from './types';

type safeLogger = (loglevel: LogLevel) => (message: string, logger: Logger | undefined) => void;
const safeLogger: safeLogger = (loglevel) => (message, logger) =>
  logger && logger[loglevel] && logger[loglevel].call(logger, message);

const logOrNothing: Logger = {
  info: safeLogger(LogLevel.info),
  debug: safeLogger(LogLevel.debug),
  error: safeLogger(LogLevel.error),
  fatal: safeLogger(LogLevel.fatal),
  trace: safeLogger(LogLevel.trace),
  warn: safeLogger(LogLevel.warn)
};

export {
  logOrNothing
};
