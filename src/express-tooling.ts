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

import { safeLogger } from './safe-logger';

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';

/**
 * Returns a function (express middleware) that validates the scopes against the user scopes
 * attached to the request (for example by `handleOAuthRequestMiddleware`).
 * If the the requested scopes are not matched request is rejected (with 403 Forbidden).
 *
 * ⚠️ If precedence function throws or return `false`, the standard scope validation is applied afterwards.
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
type requireScopesMiddleware = (scopes: string[], logger?: Logger, precedenceOptions?: PrecedenceOptions) => RequestHandler;
const requireScopesMiddleware: requireScopesMiddleware =
  (scopes, logger, precedenceOptions) =>
    (req: ExtendedRequest, res: Response, next: NextFunction) => {

      const precedenceFunction =
        precedenceOptions && typeof precedenceOptions.precedenceFunction === 'function' ?
          precedenceOptions.precedenceFunction :
          () => Promise.resolve(false);
      const precedenceErrorHandler =
        precedenceOptions && typeof precedenceOptions.precedenceErrorHandler === 'function' ?
          precedenceOptions.precedenceErrorHandler :
          () => undefined;

      precedenceFunction(req, res, next)
      .then(isAllowed => {
        if (isAllowed) {
          next();
        } else {
          // If not allowed apply standard scope validation logic
          acceptOrRejectRequest(req, res, next, scopes, logger);
        }
      })
      .catch(error => {
        try {
          precedenceErrorHandler(error, logger);
        } catch (e) {
          safeLogger(logger).error(`Error while executing precedenceErrorHandler: ${e}`);
        } finally {
          // even if precedenceFunction and precedenceErrorHandler throws
          // fallback to the default way
          acceptOrRejectRequest(req, res, next, scopes, logger);
        }
      });

      return;
    };

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
 * @param logger - optional logger
 * @returns express middleware
 */
type handleOAuthRequestMiddleware = (options: MiddlewareOptions, logger?: Logger) => RequestHandler;
const handleOAuthRequestMiddleware: handleOAuthRequestMiddleware =
  (options, logger) => {

  const {
    tokenInfoEndpoint,
    publicEndpoints
  } = options;

  const logOrNothing = safeLogger(logger);

  if (!tokenInfoEndpoint) {
    logOrNothing.error('tokenInfoEndpoint must be defined');
    throw TypeError('tokenInfoEndpoint must be defined');
  }

  const oAuthMiddleware: RequestHandler = (req, res, next) => {

    const originalUrl = req.originalUrl;

    // Skip OAuth validation for paths marked as public
    if (publicEndpoints && publicEndpoints.some(pattern => originalUrl.startsWith(pattern))) {
      next();
      return;
    }

    const authHeader = getHeaderValue(req, AUTHORIZATION_HEADER_FIELD_NAME);

    if (!authHeader) {
      logOrNothing.warn('No authorization field in header');
      rejectRequest(res, logOrNothing);
      return;
    }

    const accessToken = extractAccessToken(authHeader);
    if (!accessToken) {
      logOrNothing.warn('access_token is empty');
      rejectRequest(res, logOrNothing);
      return;
    } else {
      getTokenInfo(tokenInfoEndpoint, accessToken)
        .then(setTokeninfo(req))
        .then(next)
        .catch(err => rejectRequest(res, logOrNothing, err.status));
    }
  };

  return oAuthMiddleware;
};

const acceptOrRejectRequest = (req: ExtendedRequest,
                               res: Response,
                               next: NextFunction,
                               scopes: string[],
                               logger?: Logger): void => {

  const logOrNothing = safeLogger(logger);

  const requestScopes = req.$$tokeninfo && req.$$tokeninfo.scope;
  const userScopes = Array.isArray(requestScopes) ? requestScopes : [];

  const filteredScopes = scopes.filter((scope) => !userScopes.includes(scope));

  if (filteredScopes.length === 0) {
    logOrNothing.debug('Scopes validated successfully');
    next();
  } else {
    logOrNothing.warn(`Scope validation failed for ${scopes}`);
    rejectRequest(res, safeLogger(logger), HttpStatus.FORBIDDEN);
  }
};

export {
  PrecedenceFunction,
  PrecedenceErrorHandler,
  PrecedenceOptions,
  requireScopesMiddleware,
  handleOAuthRequestMiddleware
};
