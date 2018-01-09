import { NextFunction, Request, Response } from 'express';
import { Logger } from '.';

interface OAuthMiddlewareOptions {
  tokenInfoEndpoint: string;
  logger?: Logger;
  onNotAuthenticatedHandler?: (request: Request, resonse: Response, next: NextFunction, logger: Logger) => void;
  publicEndpoints?: string[];
}

export { OAuthMiddlewareOptions };
