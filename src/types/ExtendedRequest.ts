import * as express from 'express';

interface ExtendedRequest extends express.Request {
  $$tokeninfo?: {
    scope: string[]
  };
  originalUrl: string;
}

export { ExtendedRequest​​ };
