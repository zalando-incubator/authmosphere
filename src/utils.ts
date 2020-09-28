import * as fs from 'fs';
import { Request, Response } from 'express';

import {
  AuthorizationCodeGrantConfig,
  Logger,
  CredentialsDirConfig,
  CredentialsClientConfig,
  CredentialsUserConfig,
  CredentialsUserClientConfig,
  OAuthConfig,
  OAuthGrantType,
  RefreshGrantConfig,
  Token
} from './types';

const fsReadFile = (fileName: string, encoding: string): Promise<string> => {
  const readPromise: Promise<string> = new Promise((resolve, reject) => {
    fs.readFile(fileName, encoding, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data.toString());
    });
  });

  return readPromise;
};

const AUTHORIZATION_BEARER_PREFIX = 'Bearer';
const AUTHORIZATION_BASIC_PREFIX = 'Basic';

/**
 * Returns a promise containing the file content as json object.
 *
 * @param filePath
 * @param fileName
 * @returns {Promise<any>}
 */
const getFileDataAsObject = (filePath: string, fileName: string): Promise<any> => {
  if (filePath.substr(-1) !== '/') { // substr operates with the length of the string
    filePath += '/';
  }

  const promise = fsReadFile(filePath + fileName, 'utf-8')
    .then(JSON.parse);

  return promise;
};

/**
 * Returns the value of a specified header field from a request
 *
 * @param req
 * @param field The name of the field to return
 * @returns {string} The value of the header field
 */
const getHeaderValue = (req: Request, fieldName: string): string | undefined => {

  const headerValue = req && req.headers[fieldName];

  const normalizedHeaderValue =
    Array.isArray(headerValue) ?
      headerValue.join(' ') :
      headerValue;

  return normalizedHeaderValue;
};

const btoa = (input: string) => Buffer.from(input, 'binary').toString('base64');

/**
 * Returns a basic authentication header value with the given credentials
 *
 * @param clientId
 * @param clientSecret
 * @returns {string}
 */
const getBasicAuthHeaderValue = (clientId: string, clientSecret: string): string => {
  return AUTHORIZATION_BASIC_PREFIX + ' ' + btoa(clientId + ':' + clientSecret);
};

/**
 * Extracts and returns an access_token from an authorization header
 *
 * @param authHeader
 * @returns {any}
 */
const extractAccessToken = (authHeader: string): string | undefined => {

  const parts = authHeader.split(' ');

  // if type is bearer
  if (parts[0] === AUTHORIZATION_BEARER_PREFIX && parts.length === 2) {
    return parts[1];
  } else {
    return undefined;
  }
};

/**
 * Attach scopes on the request object.
 * The `requireScopesMiddleware` relies on this information attribute.
 *
 * ⚠️  This function mutates req.
 *
 * @param req
 * @returns {function(any): undefined}
 */
const setTokeninfo = (req: Request): (data: Token) => void => {
  return (data: Token) => {

    const tokeninfo = { ...data };

    // Avoid leaking of sensitive information
    delete tokeninfo.access_token;

    Object.assign(req, {
      $$tokeninfo: tokeninfo
    });
  };
};

/**
 * Reject a request with the given status code.
 *
 * @param res
 * @param status
 */
type rejectRequest = (res: Response, logger: Logger, status: number) => void;
const rejectRequest: rejectRequest = (res, logger, status) => {

  logger.info(`Request will be rejected with status ${status}`);

  res.sendStatus(status);
};

const isCredentialsDirConfig = (options: Record<string, unknown>): options is CredentialsDirConfig =>
  options.credentialsDir !== undefined;

const isCredentialsClientConfig = (options: Record<string, unknown>): options is CredentialsClientConfig =>
  options.clientId !== undefined && options.clientSecret !== undefined;

const isCredentialsUserConfig = (options: Record<string, unknown>): options is CredentialsUserConfig =>
  options.applicationUsername !== undefined &&  options.applicationPassword !== undefined;

const isPasswordGrantNoCredentialsDir = (options: Record<string, unknown>): options is CredentialsUserClientConfig =>
  options.grantType === OAuthGrantType.PASSWORD_CREDENTIALS_GRANT &&
   isCredentialsUserConfig(options) && isCredentialsClientConfig(options);

const checkCredentialsSource = (options: OAuthConfig) =>
  isCredentialsDirConfig(options) || isCredentialsClientConfig(options) || isPasswordGrantNoCredentialsDir(options);

const extractUserCredentials = (options: CredentialsUserConfig | CredentialsUserClientConfig): CredentialsUserConfig =>
  ({ applicationPassword: options.applicationPassword, applicationUsername: options.applicationUsername });

const extractClientCredentials =
  (options: CredentialsClientConfig | CredentialsUserClientConfig): CredentialsClientConfig =>
    ({ clientId: options.clientId, clientSecret: options.clientSecret });

/**
 * Validates options object and throws TypeError if mandatory options is not specified.
 *
 * @param options
 */
const validateOAuthConfig = (options: OAuthConfig): void => {

  if (!checkCredentialsSource(options)) {
    throw TypeError('credentials must be defined');
  }

  if (!options.accessTokenEndpoint) {
    throw TypeError('accessTokenEndpoint must be defined');
  }

  if (!options.grantType) {
    throw TypeError('grantType must be defined');
  }

  if (isAuthorizationCodeGrantConfig(options) && !options.code) {
    throw TypeError('code must be defined');
  }

  if (isAuthorizationCodeGrantConfig(options) && !options.redirectUri) {
    throw TypeError('redirectUri must be defined');
  }

  if (isRefreshGrantConfig(options) && !options.refreshToken) {
    throw TypeError('refreshToken must be defined');
  }
};

const isAuthorizationCodeGrantConfig = (config: OAuthConfig): config is AuthorizationCodeGrantConfig =>
  config.grantType === OAuthGrantType.AUTHORIZATION_CODE_GRANT;

const isRefreshGrantConfig = (config: OAuthConfig): config is RefreshGrantConfig =>
  config.grantType === OAuthGrantType.REFRESH_TOKEN_GRANT;

export {
  extractAccessToken,
  extractUserCredentials,
  extractClientCredentials,
  getBasicAuthHeaderValue,
  getFileDataAsObject,
  getHeaderValue,
  isAuthorizationCodeGrantConfig,
  isCredentialsDirConfig,
  isCredentialsUserConfig,
  isCredentialsClientConfig,
  isRefreshGrantConfig,
  isPasswordGrantNoCredentialsDir,
  rejectRequest,
  validateOAuthConfig,
  setTokeninfo
};
