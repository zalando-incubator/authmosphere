import {
  Request,
  Response,
  NextFunction
} from 'express';

/**
 * Must return a promise that return true or false.
 * If the result is true the scope checking will be skipped and next is called
 */
interface PrecedenceFunction {
  (req: Request, res: Response, next: NextFunction): Promise<boolean>;
}

interface PrecedenceOptions {
  precedenceFunction: PrecedenceFunction;
}

export {
  PrecedenceFunction,
  PrecedenceOptions
};
