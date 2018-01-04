import * as HttpStatus from 'http-status';
import {
  NextFunction,
  Response,
  RequestHandler
} from 'express';

import {
  getHeaderValue,
  rejectRequest,
  extractAccessToken,
  setTokeninfo
} from './utils';

import { getTokenInfo } from './oauth-tooling';

import {
  MiddlewareOptions,
  ExtendedRequest,
  PrecedenceFunction,
  PrecedenceErrorHandler,
  PrecedenceOptions,
  Logger
} from './types';

import { logOrNothing } from './safeLogger';

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';

/**
 * Returns a function (express middleware) that validates the scopes against the user scopes
 * attached to the request (for example by `handleOAuthRequestMiddleware`).
 * If the the requested scopes are not matched request is rejected (with 403 Forbidden).
 *
 * Usage:
 *  app.get('/path', requireScopesMiddleware['scopeA', 'scopeB'], (req, res) => { // Do route work })
 *
 * @param scopes - array of scopes that are needed to access the endpoint
 * @param logger - optional logger
 * @param precedenceOptions - This options let consumers define a way to over rule scope checking. The parameter is optional.
 *
 * @returns { function(any, any, any): undefined }
 */
function requireScopesMiddleware(scopes: string[],
                                 logger?: Logger,
                                 precedenceOptions?: PrecedenceOptions): RequestHandler {

  return function(req: ExtendedRequest, res: Response, next: NextFunction) {

    if (precedenceOptions && precedenceOptions.precedenceFunction) {
      const { precedenceFunction, precedenceErrorHandler } = precedenceOptions;

      precedenceFunction(req, res, next)
      .then(result => {
        if (result) {
          next();
        } else {
          validateScopes(req, res, next, scopes, logger);
        }
      })
      .catch(err => {
        try {
          precedenceErrorHandler(err, logger);
        } catch (err) {
          logOrNothing.error(`Error while executing precedenceErrorHandler: ${err}`, logger);
        }
      });
      return; // skip normal scope validation
    }

    validateScopes(req, res, next, scopes, logger);
  };
}

/**
 * Returns a function (middleware) to extract and validate an access token from a request.
 * Furthermore, it attaches the scopes granted by the token to the request for further usage.
 * If the token is not valid the request is rejected (with 401 Unauthorized).
 *
 * The options object can have the following properties:
 *  - publicEndpoints string[]
 *  - tokenInfoEndpoint string
 *
 * Usage:
 * app.use(handleOAuthRequestMiddleware(options))
 *
 * @param options
 * @returns express middleware
 */
function handleOAuthRequestMiddleware(options: MiddlewareOptions,
                                      logger?: Logger): RequestHandler {

  const {
    tokenInfoEndpoint,
    publicEndpoints
  } = options;

  if (!tokenInfoEndpoint) {
    logOrNothing.error('tokenInfoEndpoint must be defined', logger);
    throw TypeError('tokenInfoEndpoint must be defined');
  }

  return function(req: ExtendedRequest, res: Response, next: NextFunction) {

    const originalUrl = req.originalUrl;

    // Skip OAuth validation for paths marked as public
    if (publicEndpoints && publicEndpoints.some(pattern => originalUrl.startsWith(pattern))) {
      return next();
    }

    const authHeader = getHeaderValue(req, AUTHORIZATION_HEADER_FIELD_NAME);

    if (!authHeader) {
      logOrNothing.warn('No authorization field in header', logger);
      rejectRequest(res);
      return;
    }

    const accessToken = extractAccessToken(authHeader);
    if (!accessToken) {
      logOrNothing.warn('access_token is empty', logger);
      rejectRequest(res);
      return;
    } else {
      getTokenInfo(tokenInfoEndpoint, accessToken)
        .then(setTokeninfo(req))
        .then(next)
        .catch(err => {
          logOrNothing.error(`Error occured when requesting token info: ${err}`, logger);
          return rejectRequest(res, err.status);
        });
    }
  };
}

function validateScopes(req: ExtendedRequest,
                        res: Response,
                        next: NextFunction,
                        scopes: string[],
                        logger?: Logger): void {

  const requestScopes = req.$$tokeninfo && req.$$tokeninfo.scope;
  const userScopes = Array.isArray(requestScopes) ? requestScopes : [];

  const filteredScopes = scopes.filter((scope) => {
    return !userScopes.includes(scope);
  });

  if (filteredScopes.length === 0) {
    next();
  } else {
    logOrNothing.warn(`Scopes ${scopes} not found for user`, logger);
    rejectRequest(res, HttpStatus.FORBIDDEN);
  }
}

export {
  PrecedenceFunction,
  PrecedenceErrorHandler,
  PrecedenceOptions,
  requireScopesMiddleware,
  handleOAuthRequestMiddleware
};
