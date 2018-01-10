import { Request, Response, NextFunction } from 'express';
import { PrecedenceOptions, Logger } from '.';

type onAuthorizationFailedHandler = (request: Request, resonse: Response, next: NextFunction, scopes: string[], logger: Logger) => void;

interface ScopeMiddlewareOptions {
  logger?: Logger;
  onAuthorizationFailedHandler?: onAuthorizationFailedHandler;
  precedenceOptions?: PrecedenceOptions;
}

export {
  onAuthorizationFailedHandler,
  ScopeMiddlewareOptions
};
