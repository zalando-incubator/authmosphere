import * as HttpStatus from 'http-status';

import {
  match,
  getHeaderValue,
  rejectRequest,
  extractAccessToken,
  setTokeninfo
} from './utils';

import {
  getTokenInfo
} from './oauth-tooling';

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';

interface IPrecedenceFunction {
  (req: any, res: any, next: Function): Promise<boolean>;
}

/**
 * Returns a function (middleware) that validates the scopes against the user scopes
 * attached to the request (for example by `handleOAuthRequestMiddleware`).
 * If the the requested scopes are not matched request is rejected (with 403 Forbidden).
 *
 * Usage:
 *  app.get('/path', requireScopesMiddleware['scopeA', 'scopeB'], (req, res) => { // Do route work })
 *
 * @param scopes - array of scopes that are needed to access the endpoint
 * @param precedenceFunction - must return a promise that return true or false.
 *                             If the result is true the scope checking will be skipped
 *                             and next is called
 * @returns {function(any, any, any): undefined}
 */
function requireScopesMiddleware(scopes: string[],
                                 precedenceFunction?: IPrecedenceFunction) {

  return function(req: any, res: any, next: Function) {

    if (precedenceFunction) {
      precedenceFunction(req, res, next)
      .then(result => {
        if (result) {
          next();
        } else {
          validateScopes(req, res, next, scopes);
        }
      });
      return; // skip normal scope validation
    }

    validateScopes(req, res, next, scopes);
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
 * @returns {function(any, any, any): undefined} express middleware
 */
function handleOAuthRequestMiddleware(options: MiddlewareOptions) {

  if (!options.tokenInfoEndpoint) {
    throw TypeError('tokenInfoEndpoint must be defined');
  }

  return function(req: any, res: any, next: Function) {

    // Skip OAuth validation for paths marked as public
if (options.publicEndpoints && match(req.originalUrl, new Set(options.publicEndpoints))) {
      return next();
    }

    const accessToken = extractAccessToken(getHeaderValue(req, AUTHORIZATION_HEADER_FIELD_NAME));
    if (!accessToken) {
      rejectRequest(res);
    } else {
      getTokenInfo(options.tokenInfoEndpoint, accessToken)
      .then(setTokeninfo(req))
      .then(() => {
        next();
      })
      .catch((err) => {
        rejectRequest(res, err.status);
      });
    }
  };
}

function validateScopes(req: any, res: any, next: any, scopes: string[]) {

  const requestScopes = req.$$tokeninfo && req.$$tokeninfo.scope;

  const userScopes = new Set<String>(requestScopes || []);

  const scopesCopy = new Set<String>(scopes || []);

  for (const scope of userScopes) {
    scopesCopy.delete(scope);
  }

  if (scopesCopy.size === 0) {
    next();
  } else {
    rejectRequest(res, HttpStatus.FORBIDDEN);
  }
}

export {
  IPrecedenceFunction,
  requireScopesMiddleware,
  handleOAuthRequestMiddleware,
}
