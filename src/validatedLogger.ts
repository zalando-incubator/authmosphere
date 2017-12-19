import {
  Logger
} from './types';

type logcall = (message: string, logger: Logger | undefined) => void;
const info: logcall = (message, logger) => logger && logger.info && logger.info(message);
const debug: logcall = (message, logger) => logger && logger.debug && logger.debug(message);
const error: logcall = (message, logger) => logger && logger.error && logger.error(message);
const fatal: logcall = (message, logger) => logger && logger.fatal && logger.fatal(message);
const trace: logcall = (message, logger) => logger && logger.trace && logger.trace(message);
const warn: logcall = (message, logger) => logger && logger.warn && logger.warn(message);

const logOrNothing: Logger = {
  info,
  debug,
  error,
  fatal,
  trace,
  warn
};

export {
  logOrNothing
};
