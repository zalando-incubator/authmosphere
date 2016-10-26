import * as fs from 'fs';
import * as q from 'q';
import * as express from 'express';
import * as HttpStatus from 'http-status';
import * as btoa from 'btoa';

import {
  AUTHORIZATION_CODE_GRANT,
  REFRESH_TOKEN_GRANT
} from './constants';

const fsReadFile = q.denodeify<any>(fs.readFile);

const AUTHORIZATION_BEARER_PREFIX = 'Bearer';
const AUTHORIZATION_BASIC_PREFIX = 'Basic';

/**
 * Returns a promise containing the file content as json object.
 *
 * @param filePath
 * @param fileName
 * @returns {Promise<any>}
 */
export function getFileData(filePath: string, fileName: string): q.Promise<any> {
  if (filePath.substr(-1) !== '/') { // substr operates with the length of the string
    filePath += '/';
  }

  return fsReadFile(filePath + fileName, 'utf-8');
}

/**
 * Checks whether a given url matches one of a set of given patterns.
 *
 * @param url
 * @param patterns
 * @returns {boolean}
 */
export function match(url: string, patterns: Set<string>): boolean {

  let isPatternMatch: boolean = false;

  patterns.forEach((pattern) => {
    if (url.startsWith(pattern)) {
      isPatternMatch = true;
    }
  });

  return isPatternMatch;
}

/**
 * Returns the value of a specified header field from a request
 *
 * @param req
 * @param field The name of the field to return
 * @returns {string} The value of the header field
 */
export function getHeaderValue(req: express.Request, field: string) {
  if (req && field && req.headers.hasOwnProperty(field)) {
    return req.headers[field];
  } else {
    return '';
  }
}

/**
 * Returns a basic authentication header value with the given credentials
 *
 * @param client_id
 * @param client_secret
 * @returns {string}
 */
export function getBasicAuthHeaderValue(clientId: string, clientSecret: string) {
  return AUTHORIZATION_BASIC_PREFIX + ' ' + btoa(clientId + ':' + clientSecret);
}

/**
 * Extracts and returns an access_token from an authorization header
 *
 * @param authHeader
 * @returns {any}
 */
export function extractAccessToken(authHeader: string): string {

  const parts = authHeader.split(' ');

  // if type is bearer
  if (parts[0] === AUTHORIZATION_BEARER_PREFIX && parts.length === 2) {
    return parts[1];
  } else {
    return undefined;
  }
}

/**
 * Attach scopes on the req object for later validation.
 *
 * @param req
 * @returns {function(any): undefined}
 */
export function setScopes(req: express.Request) {
  return function(data: any) {
    Object.assign(req, {
      scopes: data.scope
    });
  };
}

/**
 * Reject a request with 401 or the given status code.
 *
 * @param res
 * @param status
 */
export function rejectRequest(res: express.Response, status?: number) {

  let _status = status ? status : HttpStatus.UNAUTHORIZED;
  res.sendStatus(_status);
}

/**
 * Validates options object and throws TypeError if mandatory options is not specified.
 *
 * @param options
 */
export function validateOAuthConfig(options: any) {

  if (!options.credentialsDir) {
    throw TypeError('credentialsDir must be defined');
  }

  if (!options.accessTokenEndpoint) {
    throw TypeError('accessTokenEndpoint must be defined');
  }

  if (!options.realm) {
    throw TypeError('realm must be defined');
  }

  if (!options.grantType) {
    throw TypeError('grantType must be defined');
  }

  if (options.grantType === AUTHORIZATION_CODE_GRANT && !options.code) {
    throw TypeError('code must be defined');
  }

  if (options.grantType === AUTHORIZATION_CODE_GRANT && !options.redirectUri) {
    throw TypeError('redirectUri must be defined');
  }

  if (options.grantType === REFRESH_TOKEN_GRANT && !options.refreshToken) {
    throw TypeError('refreshToken must be defined');
  }
}
