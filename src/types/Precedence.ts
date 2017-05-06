import * as express from 'express';

import { Logger } from './';

/**
 * Must return a promise that return true or false. If the result is true the scope checking will be skipped and next is called
 */
interface PrecedenceFunction {
  (req: express.Request, res: express.Response, next: express.NextFunction): Promise<boolean>;
}

/**
 * Will be called when IPrecedenceFunction throws an error. Should be side effect free, returned Promises are ignored.
 */
interface PrecedenceErrorHandler {
  (err: any, logger: Logger): any;
}

interface PrecedenceOptions {
  precedenceFunction: PrecedenceFunction;
  precedenceErrorHandler: PrecedenceErrorHandler;
  logger: Logger;
}

export {
  PrecedenceFunction,
  PrecedenceErrorHandler,
  PrecedenceOptions
};
