/**
 * Defines a logger.
 * Can be console.log or any other framework you use on the server side and match this interface.
 */
interface Logger {
  info(message: string, error?: any): void;
  debug(message: string, error?: any): void;
  error(message: string, error?: any): void;
  fatal(message: string, error?: any): void;
  trace(message: string, error?: any): void;
  warn(message: string, error?: any): void;
}

enum LogLevel {
  info,
  debug,
  error,
  fatal,
  trace,
  warn
}

export {
  Logger,
  LogLevel
};
