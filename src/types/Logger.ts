/**
 * Defines a logger.
 * Can be console.log or any other framework you use on the server side and match this interface.
 */
type LogFunction = (message: string, ...args: any[]) => void;

interface Logger {
  info: LogFunction;
  debug: LogFunction;
  error: LogFunction;
  fatal: LogFunction;
  trace: LogFunction;
  warn: LogFunction;
}

enum LogLevel {
  info = 'info',
  debug = 'debug',
  error = 'error',
  fatal = 'fatal',
  trace = 'trace',
  warn = 'warn'
}

export {
  Logger,
  LogLevel,
  LogFunction
};
