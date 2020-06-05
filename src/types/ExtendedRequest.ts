import { Request } from 'express';

interface ExtendedRequest extends Request {
  $$tokeninfo?: {
    scope: string[]
  };
  originalUrl: string;
}

export {
  ExtendedRequest
};
