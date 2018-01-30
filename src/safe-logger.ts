import {
  Logger
} from './types';

const loggerOrNoop = (prop: string, obj: any) =>
  (obj !== undefined && obj[prop] !== undefined) ? obj[prop].bind(obj) : () => undefined;

const safeLogger = (logger?: Logger): Logger => {

  return {
    info: loggerOrNoop('info', logger),
    debug: loggerOrNoop('debug', logger),
    error: loggerOrNoop('error', logger),
    fatal: loggerOrNoop('fatal', logger),
    trace: loggerOrNoop('trace', logger),
    warn: loggerOrNoop('warn', logger)
  };
};

export {
  safeLogger
};
