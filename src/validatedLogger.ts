import {
  Logger,
  LogLevel
} from './types';

type validateLogger = (loglevel: LogLevel) => (message: string, logger: Logger | undefined) => void;
const validateLogger: validateLogger = (loglevel) => (message, logger) =>
  logger && logger[loglevel] && logger[loglevel].call(logger, message);

const logOrNothing: Logger = {
  info: validateLogger(LogLevel.info),
  debug: validateLogger(LogLevel.debug),
  error: validateLogger(LogLevel.error),
  fatal: validateLogger(LogLevel.fatal),
  trace: validateLogger(LogLevel.trace),
  warn: validateLogger(LogLevel.warn)
};

export {
  logOrNothing
};
