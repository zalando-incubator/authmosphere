import {
  Logger,
  LogLevel
} from './types';

type validateLogger = (loglevel: LogLevel) => (message: string, logger: Logger | undefined) => void;
const validateLogger: validateLogger = (loglevel) => (message, logger) => {
  if (logger) {
    switch (loglevel) {
      case LogLevel.debug: {
        logger.debug(message);
        break;
      }
      case LogLevel.error: {
        logger.error(message);
        break;
      }
      case LogLevel.fatal: {
        logger.fatal(message);
        break;
      }
      case LogLevel.info: {
        logger.info(message);
        break;
      }
      case LogLevel.trace: {
        logger.trace(message);
        break;
      }
      case LogLevel.warn: {
        logger.warn(message);
        break;
      }
      default: {
        // No Logger defined
        break;
      }
    }
  }
};

const info = validateLogger(LogLevel.info);
const debug = validateLogger(LogLevel.debug);
const error = validateLogger(LogLevel.error);
const fatal = validateLogger(LogLevel.fatal);
const trace = validateLogger(LogLevel.trace);
const warn = validateLogger(LogLevel.warn);

export {
  info,
  debug,
  error,
  fatal,
  trace,
  warn
};
