import { Request, Response, NextFunction } from 'express';
import { PrecedenceOptions, Logger } from '.';

interface ScopeMiddlewareOptions {
  logger?: Logger;
  onAuthorizationFailedHandler?: (request: Request, resonse: Response, next: NextFunction, scopes: string[], logger: Logger) => void;
  precedenceOptions?: PrecedenceOptions;
}

export {
  ScopeMiddlewareOptions
};
