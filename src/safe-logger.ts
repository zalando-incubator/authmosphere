import { omit, pathOr } from 'rambda';
import {
  Logger, LogFunction
} from './types';

const isLogfunction = (func?: ((message: string, ...args: any[]) => void) | undefined): func is LogFunction =>
  typeof func === 'function' &&
  func.length > 0;

const voidLogging: LogFunction = () => undefined;

const loggerOrNoop =
  (logfunction?: undefined | LogFunction): LogFunction => isLogfunction(logfunction) ? logfunction : voidLogging;

const safeLogger =
  <T>(logger?: T): (Omit<T, 'info' | 'debug' | 'error' | 'fatal' | 'trace' | 'warn'> & Logger) | Logger => {

    const safeLoggerObject = {
      info: loggerOrNoop(pathOr(undefined, 'info', logger)),
      debug: loggerOrNoop(pathOr(undefined, 'debug', logger)),
      error: loggerOrNoop(pathOr(undefined, 'error', logger)),
      fatal: loggerOrNoop(pathOr(undefined, 'fatal', logger)),
      trace: loggerOrNoop(pathOr(undefined, 'trace', logger)),
      warn: loggerOrNoop(pathOr(undefined, 'warn', logger))
    };

    const reducedLogger = omit(['info', 'debug', 'error', 'fatal', 'trace', 'warn'], logger);

    return logger ? { ...reducedLogger, ...safeLoggerObject } : safeLoggerObject;
  };

export {
  safeLogger
};
