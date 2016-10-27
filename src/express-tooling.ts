import * as HttpStatus from 'http-status';

import {
  rejectRequest,
} from './utils';

/**
 * Returns a function (middleware) that validates the scopes against the user scopes
 * attached to the request (for example by `handleOAuthRequestMiddleware`).
 * If the the requested scopes are not matched request is rejected (with 403 Forbidden).
 *
 * Usage:
 *  app.get('/path', requireScopesMiddleware['scopeA', 'scopeB'], (req, res) => { // Do route work })
 *
 * @param scopes
 * @returns {function(any, any, any): undefined}
 */
function requireScopesMiddleware(scopes: string[]) {
  return function(req: any, res: any, next: Function) {

    const userScopes     = new Set<String>(req.scopes || []);

    let scopesCopy = new Set<String>(scopes || []);

    for (let scope of userScopes) {
      scopesCopy.delete(scope);
    }

    if (scopesCopy.size === 0) {
      next();
    } else {
      rejectRequest(res, HttpStatus.FORBIDDEN);
    }
  };
}

export {
  requireScopesMiddleware
}
