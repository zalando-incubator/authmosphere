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
  OAuthConfig,
  Token,
  OAuthGrantType,
  BodyParameters,
  Logger
} from './types';

import { safeLogger } from './safeLogger';

const USER_JSON = 'user.json';
const CLIENT_JSON = 'client.json';
const OAUTH_CONTENT_TYPE = 'application/x-www-form-urlencoded';

/**
 * Returns URI to request authorization code with the given parameters.
 *
 * @param authorizationEndpoint string
 * @param redirectUri string
 * @param clientId string
 * @param queryParams {} optional
 * @returns {string}
 */
function createAuthCodeRequestUri(authorizationEndpoint: string,
                                  redirectUri: string,
                                  clientId: string,
                                  queryParams?: {}): string {

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
 * @param logger
 * @param queryParams optional
 * @returns {Promise<Token>}
 */
function requestAccessToken(bodyObject: any,
                            authorizationHeaderValue: string,
                            accessTokenEndpoint: string,
                            logger: Logger,
                            queryParams?: Object): Promise<Token> {

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
        return response.json()
        .catch((error) => Promise.reject(error))
        .then((error) => Promise.reject({
          // support error shape defined in https://tools.ietf.org/html/rfc6749#section-5.2
          // but do fall back if for some reason the definition is not satisfied
          error: (error && error.error) ? error.error : error,
          errorDescription: (error && error.error_description) ? error.error_description : undefined,
          status
        }));
      }

      logger.debug(`Successful request to ${accessTokenEndpoint}`);
      return response.json();
    })
    .catch((error) => {
      logger.error(`Unsuccessful request to ${accessTokenEndpoint}`, error);
      return Promise.reject({
        message: `Error requesting access token from ${accessTokenEndpoint}`,
        error
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
 * @param logger - optional logger
 * @returns {Promise<Token>}
 */
function getTokenInfo(tokenInfoUrl: string, accessToken: string, logger?: Logger): Promise<Token> {

  const logOrNothing = safeLogger(logger);

  const promise = fetch(`${tokenInfoUrl}?access_token=${accessToken}`)
  .then((response) => {

    const status = response.status;

    return response.json()
    .then((data) => {

      if (status === HttpStatus.OK) {
        logOrNothing.debug(`Successful request to ${tokenInfoUrl}`);
        return data;
      } else {
        logOrNothing.debug(`Unsuccessful request to ${tokenInfoUrl}`, { status, data });
        return Promise.reject({ status, data });
      }
    });
  })
  .catch((error) => {

    logOrNothing.warn(`Error validating token via ${tokenInfoUrl}`);

    return Promise.reject({
      message: `Error validating token via ${tokenInfoUrl}`,
      error
    });
  });

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
 * @param options
 * @param logger - optional logger
 * @returns {Promise<T>}
 */
function getAccessToken(options: OAuthConfig, logger?: Logger): Promise<Token> {

  const logOrNothing = safeLogger(logger);

  validateOAuthConfig(options);

  const credentialsPromises = [getFileData(options.credentialsDir, CLIENT_JSON)];

  // For PASSWORD_CREDENTIALS_GRANT wen need user credentials as well
  if (options.grantType === OAuthGrantType.PASSWORD_CREDENTIALS_GRANT) {
    credentialsPromises.push(getFileData(options.credentialsDir, USER_JSON));
  }

  return Promise.all(credentialsPromises)
  .then((credentials) => {

    const clientData = JSON.parse(credentials[0]);

    let bodyParameters: BodyParameters;

    if (options.grantType === OAuthGrantType.PASSWORD_CREDENTIALS_GRANT) {
      const userData = JSON.parse(credentials[1]);
      bodyParameters = {
        'grant_type': options.grantType,
        'username': userData.application_username,
        'password': userData.application_password
      };
    } else if (options.grantType === OAuthGrantType.CLIENT_CREDENTIALS_GRANT) {
      bodyParameters = {
        'grant_type': options.grantType
      };
    }  else if (options.grantType === OAuthGrantType.AUTHORIZATION_CODE_GRANT) {
      bodyParameters = {
        'grant_type': options.grantType,
        'code': options.code,
        'redirect_uri': options.redirectUri
      };
    } else if (options.grantType === OAuthGrantType.REFRESH_TOKEN_GRANT) {
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
      options.accessTokenEndpoint, logOrNothing, options.queryParams);
  });
}

export {
  getTokenInfo,
  getAccessToken,
  createAuthCodeRequestUri
};
