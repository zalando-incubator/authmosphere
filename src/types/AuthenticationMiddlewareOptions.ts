import { NextFunction, Request, Response } from 'express';
import { Logger } from '.';

type onNotAuthenticatedHandler = (request: Request, resonse: Response, next: NextFunction, logger: Logger) => void;

type AuthenticationMiddlewareOptions = {
  tokenInfoEndpoint: string,
  logger?: Logger,
  onNotAuthenticatedHandler?: onNotAuthenticatedHandler,
  publicEndpoints?: string[]
};

export {
  onNotAuthenticatedHandler,
  AuthenticationMiddlewareOptions
};
