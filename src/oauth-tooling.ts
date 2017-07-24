import * as qs from 'querystring';
import * as HttpStatus from 'http-status';
import fetch from 'node-fetch';
import * as formurlencoded from 'form-urlencoded';

import {
  getFileData,
  getBasicAuthHeaderValue,
  validateOAuthConfig
} from './utils';

import {
  AUTHORIZATION_CODE_GRANT,
  PASSWORD_CREDENTIALS_GRANT,
  REFRESH_TOKEN_GRANT
} from './constants';

import { OAuthConfig } from './types/OAuthConfig';
import { Token } from './types';
import { BodyParameters } from './types/BodyParameters';

const USER_JSON = 'user.json';
const CLIENT_JSON = 'client.json';
const OAUTH_CONTENT_TYPE = 'application/x-www-form-urlencoded';

/**
 * Returns URI to request authorization code with the given parameters.
 *
 * @param authorizationEndpoint string
 * @param clientId string
 * @param redirectUri string
 * @param queryParams {} optional
 * @returns {string}
 */
function createAuthCodeRequestUri(authorizationEndpoint: string, clientId: string,
                                  redirectUri: string, queryParams?: {}): string {

  const _queryParams = {
    'client_id': clientId,
    'redirect_uri': redirectUri,
    'response_type': 'code',
    ...queryParams
  };

  const queryString = qs.stringify(_queryParams);
  // we are unescaping again since we did not escape before using querystring and we do not want to break anything
  const unescapedQueryString = qs.unescape(queryString);

  return `${authorizationEndpoint}?${unescapedQueryString}`;
}

/**
 * Makes a request to the `accessTokenEndpoint` with the given parameters.
 * Resolves with object containing property `accessToken` with the access token
 * (in case of success). Otherwise, rejects with error message.
 *
 * @param bodyObject an object of values put in the body
 * @param authorizationHeaderValue
 * @param accessTokenEndpoint
 * @param queryParams optional
 * @returns {Promise<Token>}
 */
function requestAccessToken(bodyObject: any, authorizationHeaderValue: string,
                            accessTokenEndpoint: string, queryParams?: Object): Promise<Token> {

  const url = buildRequestAccessTokenUrl(accessTokenEndpoint, queryParams);

  const promise =
    fetch(url, {
      method: 'POST',
      body: formurlencoded(bodyObject),
      headers: {
        'Authorization': authorizationHeaderValue,
        'Content-Type': OAUTH_CONTENT_TYPE
      }
    })
    .then((response) => {

      const status = response.status;

      if (status !== HttpStatus.OK) {
        return Promise.reject(`Response failed with status code ${status}`);
      }

      return response.json();
    })
    .then((data) => Promise.resolve(data))
    .catch((err) => {
      return Promise.reject({
        msg: `Error requesting access token from ${accessTokenEndpoint}`,
        err
      });
    });

  return promise;
}

/**
 * Build url string to request access token, optionally with given query parameters.
 *
 * @param accessTokenEndpoint string
 * @param queryParams Object key value paris which will be added as query parameters
 * @returns {string}
 */
function buildRequestAccessTokenUrl(accessTokenEndpoint: string, queryParams?: Object): string {

  if (queryParams !== undefined) {
    const queryString = qs.stringify(queryParams);

    // we are unescaping again since we did not escape before using querystring and we do not want to break anything
    const unescapedQueryString = qs.unescape(queryString);

    return `${accessTokenEndpoint}?${unescapedQueryString}`;
  } else {
    return accessTokenEndpoint;
  }
}

/**
 * Makes a request to the `tokenInfoUrl` to validate the given `accessToken`.
 * Resolves with an object containing access token information in case of success.
 * Otherwise, rejects with an error message.
 *
 * @param tokenInfoUrl
 * @param accessToken
 * @returns {Promise<Token>}
 */
function getTokenInfo(tokenInfoUrl: string, accessToken: string): Promise<Token> {

    const promise = fetch(`${tokenInfoUrl}?access_token=${accessToken}`)
      .then((response) => {

        const status = response.status;

        return response
          .json()
          .then((data) => {

            if (response.status === HttpStatus.OK) {
              return data;
            } else {
              return Promise.reject({ status, data });
            }
          });
      })
      .catch((err) => Promise.reject({
          msg: `Error requesting tokeninfo from ${tokenInfoUrl}`,
          err
        }));

  return promise;
}

/**
 * Helper function to get an access token for the specified scopes.
 * Reads client and user credentials (to build a valid authorization header) and makes a
 * request to the `accessTokenEndpoint`.
 *
 * Resolves with object containing property `accessToken` with the access token
 * (in case of success). Otherwise, rejects with error message.
 *
 * Currently supports the following OAuth flows (specified by the `grantType` property):
 *  - Resource Owner Password Credentials Grant (PASSWORD_CREDENTIALS_GRANT)
 *  - Authorization Code Grant (AUTHORIZATION_CODE_GRANT)
 *  - Refresh Token Grant (REFRESH_TOKEN_GRANT)
 *
 *  The `options` object can have the following properties:
 *  - credentialsDir string
 *  - grantType string
 *  - accessTokenEndpoint string
 *  - scopes string[] optional
 *  - queryParams {} optional
 *  - redirect_uri string optional (required with AUTHORIZATION_CODE_GRANT)
 *  - code string optional (required with AUTHORIZATION_CODE_GRANT)
 *  - refreshToken string optional (required with REFRESH_TOKEN_GRANT)
 *
 * @param options
 * @returns {Promise<T>}
 */
function getAccessToken(options: OAuthConfig): Promise<Token> {

  validateOAuthConfig(options);

  return Promise.all([
    getFileData(options.credentialsDir, USER_JSON),
    getFileData(options.credentialsDir, CLIENT_JSON)
  ])
  .then((credentials) => {

    const userData = JSON.parse(credentials[0]);
    const clientData = JSON.parse(credentials[1]);

    let bodyParameters: BodyParameters;

    if (options.grantType === PASSWORD_CREDENTIALS_GRANT) {
      bodyParameters = {
        'grant_type': options.grantType,
        'username': userData.application_username,
        'password': userData.application_password
      };
    } else if (options.grantType === AUTHORIZATION_CODE_GRANT) {
      bodyParameters = {
        'grant_type': options.grantType,
        'code': options.code,
        'redirect_uri': options.redirectUri
      };
    } else if (options.grantType === REFRESH_TOKEN_GRANT) {
      bodyParameters = {
        'grant_type': options.grantType,
        'refresh_token': options.refreshToken
      };
    } else {
      throw TypeError('invalid grantType');
    }

    if (options.scopes) {
      Object.assign(bodyParameters, {
        scope: options.scopes.join(' ')
      });
    }

    const authorizationHeaderValue = getBasicAuthHeaderValue(clientData.client_id, clientData.client_secret);

    return requestAccessToken(bodyParameters, authorizationHeaderValue,
      options.accessTokenEndpoint, options.queryParams);
  });
}

export {
  getTokenInfo,
  getAccessToken,
  createAuthCodeRequestUri
};
