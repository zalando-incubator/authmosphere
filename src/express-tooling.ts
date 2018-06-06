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

import {
  getTokenInfo as defaultGetTokenInfo
} from './oauth-tooling';

import {
  AuthenticationMiddlewareOptions,
  ExtendedRequest,
  onAuthorizationFailedHandler,
  PrecedenceFunction,
  PrecedenceOptions,
  ScopeMiddlewareOptions,
  GetTokenInfo
} from './types';

import { safeLogger } from './safe-logger';

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';

/**
 * A factory that returns a middleware that compares scopes attached to `express.Request` object with a given list (`scopes` parameter).
 * If all required scopes are matched, the middleware calls `next`. Otherwise, it rejects the request with _403 FORBIDDEN_.
 *
 * * ⚠️&nbsp;&nbsp;This middleware requires scope information to be attached to the `Express.request` object.
 * The `authenticationMiddleware` can do this job. Otherwise `request.$$tokeninfo.scope: string[]` has to be set manually.
 *
 * There may apply cases where another type of authorization should be used. For that cases `options.precedenceFunction` has to be set. If the `precedence` function returns with anything else than resolved state normal scope validation is applied afterwards.
 *
 * Detailed middleware authorization flow:
 *
 * ```
 * +-----------------------------------+
 * |   is precedenceFunction defined?  |
 * +-----------------------------------+
 *         |             |
 *         |             | yes
 *         |             v
 *         |    +----------------------+    resolve   +--------+       +---------------+
 *      no |    | precedenceFunction() |------------->| next() | ----->| call endpoint |
 *         |    +----------------------+              +--------+       +---------------+
 *         |             |
 *         |             | reject
 *         v             v
 * +-----------------------------------+      yes     +--------+       +---------------+
 * | scopes match with requiredScopes? |------------->| next() |------>| call endpoint |
 * +-----------------------------------+              +--------+       +---------------+
 *         |
 *     no/ |
 *   throw v
 * +----------------------------------+       yes     +--------------------------------+
 * | is onAuthorizationFailedHandler  |-------------->| onAuthorizationFailedHandler() |
 * | configured?                      |               +--------------------------------+
 * +----------------------------------+
 *         |
 *         |               no                         +--------------------------------+
 *         +----------------------------------------->|    response.sendStatus(403)    |
 *                                                    +--------------------------------+
 * ```
 *
 * The options object can have the following properties:
 * - optional logger
 * - onAuthorizationFailedHandler - a customer handler method that
 *                                  is executed if callee is not authorized,
 *                                  If not provided, `response.sendStatus(403)` is called.
 * - precedenceOptions - Let consumers define a handler to overrule scope checking.
 *                       ⚠️ If precedence function throws or return `false`,
 *                        the standard scope validation is applied afterwards.
 *
 *
 * Usage:
 *  app.get('/path', requireScopesMiddleware(['scopeA', 'scopeB']), (req, res) => { // handle request })
 *
 * @param scopes - array of scopes that are needed to access the endpoint
 * @param options: ScopeMiddlewareOptions
 *
 * @returns { function(any, any, any): undefined }
 */
type requireScopesMiddleware = (scopes: string[], options?: ScopeMiddlewareOptions) => RequestHandler;
const requireScopesMiddleware: requireScopesMiddleware =
  (scopes, options = {}) =>
    (request: ExtendedRequest, response: Response, nextFunction: NextFunction) => {

      const {
        logger,
        precedenceOptions
      } = options;
      // Need to do this to not shadow the symbol
      const _onAuthorizationFailedHandler = options.onAuthorizationFailedHandler;

      const logOrNothing = safeLogger(logger);

      const authorizationFailedHandler: onAuthorizationFailedHandler =
        typeof _onAuthorizationFailedHandler === 'function' ?
          (req, res, next, _scopes, _logger) =>
            _onAuthorizationFailedHandler(req, res, next, _scopes, _logger) :
          (req, res, next, _scopes, _logger) =>
            rejectRequest(res, _logger, HttpStatus.FORBIDDEN);

      const precedenceFunction =
        precedenceOptions && typeof precedenceOptions.precedenceFunction === 'function' ?
          precedenceOptions.precedenceFunction :
          () => Promise.resolve(false);

      precedenceFunction(request, response, nextFunction)
      .catch(error => {
        logOrNothing.warn(`Error while executing precedenceFunction: ${error}`);
        // PrecedencFunction was not successful
        //  false -> trigger fallback to default scope validation
        return false;
      })
      .then(isAllowed => {
        if (isAllowed) { // precedenceFunction grants access
          logOrNothing.debug('PrecedenceFunction grants access');
          nextFunction();
        } else if (validateScopes(request, scopes)) {  // scope validation grants access
          logOrNothing.debug('Scopes validated successfully');
          nextFunction();
        } else {
          logOrNothing.warn(`Scope validation failed for ${scopes}`);
          authorizationFailedHandler(request, response, nextFunction, scopes, logOrNothing);
        }
      });
    };

/**
 * Returns a function (middleware) to extract and validate an access token from a request.
 * Furthermore, it attaches the scopes granted by the token to the request for further usage.
 *
 * If the token is not valid the onNotAuthenticatedHandler is called.
 *
 * The options object can have the following properties:
 *  - publicEndpoints string[]
 *  - tokenInfoEndpoint string
 *  - optional logger
 *  - optional getTokenInfo
 *  - onNotAuthenticatedHandler - a customer handler method that
 *                                is executed if callee is not authorized,
 *                                If not provided, `response.sendStatus(401)` is called.
 *
 * Usage:
 * app.use(handleOAuthRequestMiddleware(options))
 *
 * @param options: AuthenticationMiddlewareOptions
 * @returns express middleware
 */
type authenticationMiddleware = (options: AuthenticationMiddlewareOptions) => RequestHandler;
const authenticationMiddleware: authenticationMiddleware = (options) => {

  const {
    tokenInfoEndpoint,
    publicEndpoints,
    logger,
    getTokenInfo: customGetTokenInfo
  } = options;

  const logOrNothing = safeLogger(logger);
  const getTokenInfo: GetTokenInfo<{}> = customGetTokenInfo || defaultGetTokenInfo;

  if (!tokenInfoEndpoint) {
    logOrNothing.error('tokenInfoEndpoint must be defined');
    throw TypeError('tokenInfoEndpoint must be defined');
  }

  const oAuthMiddleware: RequestHandler = (req, res, next) => {

    const customNotAuthenticatedHandler = options.onNotAuthenticatedHandler;

    const notAuthenticatedHandler: rejectRequest =
      typeof customNotAuthenticatedHandler === 'function' ?
        (_req, _logger, status) => customNotAuthenticatedHandler(req, res, next, logOrNothing) :
        rejectRequest;

    const originalUrl = req.originalUrl;

    // Skip OAuth validation for paths marked as public
    if (publicEndpoints && publicEndpoints.some(pattern => originalUrl.startsWith(pattern))) {
      next();
      return;
    }

    const authHeader = getHeaderValue(req, AUTHORIZATION_HEADER_FIELD_NAME);

    if (!authHeader) {
      logOrNothing.warn('No authorization field in header');
      notAuthenticatedHandler(res, logOrNothing, HttpStatus.UNAUTHORIZED);
      return;
    }

    const accessToken = extractAccessToken(authHeader);
    if (!accessToken) {
      logOrNothing.warn('access_token is empty');
      notAuthenticatedHandler(res, logOrNothing, HttpStatus.UNAUTHORIZED);
      return;
    } else {
      getTokenInfo(tokenInfoEndpoint, accessToken)
        .then(setTokeninfo(req))
        .then(next)
        // TODO we should send 500 for issues with network etc.
        //      we should send HttpStatus.UNAUTHORIZED for invalid token
        .catch(err => notAuthenticatedHandler(res, logOrNothing, HttpStatus.UNAUTHORIZED));
    }
  };

  return oAuthMiddleware;
};

const validateScopes = (req: ExtendedRequest, scopes: string[]): boolean => {

  const requestScopes = req.$$tokeninfo && req.$$tokeninfo.scope;
  const userScopes = Array.isArray(requestScopes) ? requestScopes : [];

  const filteredScopes = scopes.filter((scope) => !userScopes.includes(scope));

  return filteredScopes.length === 0;
};

export {
  PrecedenceFunction,
  PrecedenceOptions,
  requireScopesMiddleware,
  authenticationMiddleware
};
