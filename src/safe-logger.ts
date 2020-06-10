import {
  Logger, LogFunction
} from './types';

const voidLogging: LogFunction = () => undefined;

const loggerOrNoop = (logfunction?: LogFunction): LogFunction =>
  logfunction ? logfunction : voidLogging;

const safeLogger = (logger?: Logger): Logger => {

  return {
    ...logger,
    info: loggerOrNoop(logger?.info),
    debug: loggerOrNoop(logger?.debug),
    error: loggerOrNoop(logger?.error),
    fatal: loggerOrNoop(logger?.fatal),
    trace: loggerOrNoop(logger?.trace),
    warn: loggerOrNoop(logger?.warn)
  };
};

export {
  safeLogger
};
