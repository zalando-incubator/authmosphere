import {
  Logger
} from './types';

const safeCall = (prop: string, obj?: any) =>
  (obj !== undefined && obj[prop] !== undefined) ? obj[prop] : () => undefined;

const safeLogger = (logger?: Logger): Logger => {

  return {
    info: safeCall('info', logger),
    debug: safeCall('debug', logger),
    error: safeCall('error', logger),
    fatal: safeCall('fatal', logger),
    trace: safeCall('trace', logger),
    warn: safeCall('warn', logger)
  };
};

export {
  safeLogger
};
