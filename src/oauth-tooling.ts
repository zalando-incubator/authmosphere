'use strict';

import * as HttpStatus from 'http-status';
import * as fetch from 'node-fetch';
import * as formurlencoded from 'form-urlencoded';

import {
  getFileData,
  getBasicAuthHeaderValue,
  match,
  setScopes,
  getHeaderValue,
  rejectRequest,
  extractAccessToken,
  validateOAuthConfig
} from './utils';

import {
  EMPLOYEES_REALM,
  AUTHORIZATION_CODE_GRANT,
  PASSWORD_CREDENTIALS_GRANT
} from './constants';

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';
const USER_JSON = 'user.json';
const CLIENT_JSON = 'client.json';
const OAUTH_CONTENT_TYPE = 'application/x-www-form-urlencoded';

/**
 * Returns URI to request authorization code with the given parameters.
 *
 * @param authorizationEndpoint
 * @param clientId
 * @param redirectUri
 * @returns {string}
 */
function createAuthCodeRequestUri(authorizationEndpoint: string, clientId: string,
                                  redirectUri: string) {
  return authorizationEndpoint +
    '?client_id=' + clientId +
    '&redirect_uri=' + redirectUri +
    '&response_type=code' +
    '&realm=' + EMPLOYEES_REALM;
}

/**
 * Returns the access token from the given server.
 *
 * @param bodyObject an object of values put in the body
 * @param authorizationHeaderValue
 * @param accessTokenEndpoint
 * @param realm
 * @returns {Promise<T>|Q.Promise<U>}
 */
function requestAccessToken(bodyObject: any, authorizationHeaderValue: string,
                            accessTokenEndpoint: string, realm: string): Promise<any> {

  const promise = new Promise(function(resolve, reject) {

    fetch(accessTokenEndpoint + '?realm=' + realm, {
      method: 'POST',
      body: formurlencoded(bodyObject),
      headers: {
        'Authorization': authorizationHeaderValue,
        'Content-Type': OAUTH_CONTENT_TYPE
      }
    })
      .then((response) => {
        if (response.status !== HttpStatus.OK) {
          return reject({
            error: 'Got ' + response.status + ' from ' + accessTokenEndpoint
          });
        } else {
          return response.json();
        }
      })
      .then((data) => {
        return resolve(data);
      })
      .catch((err) => {
        return reject('Could not get access token from server: ' + err);
      });
  });

  return promise;
}

/**
 * Makes a request to the `tokenInfoUrl` to validate the given `accessToken.
 *
 * @param tokenInfoUrl
 * @param accessToken
 * @param res
 * @returns {Promise<T>}
 */
function getTokenInfo(tokenInfoUrl: string, accessToken: string): Promise<any> {

  const promise = new Promise(function(resolve, reject) {

    fetch(tokenInfoUrl + '?access_token=' + accessToken)
      .then( response => {
        if (response.status !== HttpStatus.OK) {
          return reject({
            error: 'Got ' + response.status + ' from ' + tokenInfoUrl
          });
        } else {
          return response.json();
        }
      })
      .then((data) => {
        return resolve(data);
      })
      .catch( err => {
        return reject(err);
      });
  });

  return promise;
}

/**
 * Helper function to get an access token for the specified scopes.
 *
 * Currently supports the following OAuth flows (specified by the `grantType` property):
 *  - Resource Owner Password Credentials Grant (PASSWORD_CREDENTIALS_GRANT)
 *  - Authorization Code Grant (AUTHORIZATION_CODE_GRANT)
 *
 *  The options object can have the following properties:
 *  - credentialsDir string
 *  - grant_type string
 *  - accessTokenEndpoint string
 *  - realm string
 *  - scopes string optional
 *  - redirect_uri string optional (required with AUTHORIZATION_CODE_GRANT)
 *  - code string optional (required with AUTHORIZATION_CODE_GRANT)
 *
 * @param scopes
 * @param options
 * @returns {any} object with property `accessToken` if everything worked fine,
 *          otherwise object with property `error`containing an error message.
 */
function getAccessToken(options: any): Promise<string> {

  validateOAuthConfig(options);

  return Promise.all([
    getFileData(options.credentialsDir, USER_JSON),
    getFileData(options.credentialsDir, CLIENT_JSON)
  ])
    .then((credentials) => {

      const userData = JSON.parse(credentials[0]);
      const clientData = JSON.parse(credentials[1]);

      let bodyParameters;

      if (options.grantType === PASSWORD_CREDENTIALS_GRANT) {
        bodyParameters = {
          'grant_type': options.grantType,
          'username': userData.application_username,
          'password': userData.application_password,
          'scope': options.scopes.join(' ')
        };
      } else if (options.grantType === AUTHORIZATION_CODE_GRANT) {
        bodyParameters = {
          'grant_type': options.grantType,
          'code': options.code,
          'redirect_uri': options.redirectUri,
          'scope': options.scopes.join(' ')
        };
      } else {
        throw TypeError('invalid grantType');
      }

      const authorizationHeaderValue = getBasicAuthHeaderValue(clientData.client_id, clientData.client_secret);

      return requestAccessToken(bodyParameters, authorizationHeaderValue,
        options.accessTokenEndpoint, options.realm);
    });
}

/**
 * Specifies the scopes needed to access this endpoint.
 *
 * Returns a function that validates the scopes against the
 * user scopes attached to the request.
 *
 * Usage:
 *  route.get('/path', requireScopesMiddleware['scopeA', 'scopeB'], () => { // Do route work })
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

/**
 * Express middleware to extract and validate an access token.
 * Furthermore, it attaches the scopes matched by the token to the request for further usage.
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
function handleOAuthRequestMiddleware(options: any) {

  if (!options.tokenInfoEndpoint) {
    throw TypeError('tokenInfoEndpoint must be defined');
  }

  return function(req: any, res: any, next: Function) {

    // Skip OAuth validation for paths marked as public
    if (options.publicEndpoints && match(req.originalUrl, options.publicEndpoints)) {
      return next();
    }

    const accessToken = extractAccessToken(getHeaderValue(req, AUTHORIZATION_HEADER_FIELD_NAME));
    if (!accessToken) {
      rejectRequest(res);
    } else {
      getTokenInfo(options.tokenInfoEndpoint, accessToken)
        .then(setScopes(req))
        .then(() => {
          next();
        })
        .catch((err) => {
          rejectRequest(res, err.status);
        });
    }
  };
}

export {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  getTokenInfo,
  getAccessToken,
  createAuthCodeRequestUri
}
