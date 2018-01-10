import * as fs from 'fs';
import * as HttpStatus from 'http-status';
import * as btoa from 'btoa';
import { Request, Response } from 'express';

import {
   OAuthConfig,
   Token,
   OAuthGrantType,
   Logger,
   CredentialsDirConfig,
   CredentialsClientConfig,
   CredentialsUserConfig,
   CredentialsUserClientConfig,
   PasswordCredentialsGrantConfig
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
const getFileDataAsObject = (filePath: string, fileName: string) => {
  if (filePath.substr(-1) !== '/') { // substr operates with the length of the string
    filePath += '/';
  }

  const promise = fsReadFile(filePath + fileName, 'utf-8')
    .then((data) => JSON.parse(data));

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

  const normalizedHeaderValue = Array.isArray(headerValue) ?
                                  headerValue.join(' ') :
                                  headerValue;

  return normalizedHeaderValue;
};

/**
 * Returns a basic authentication header value with the given credentials
 *
 * @param client_id
 * @param client_secret
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
 * Reject a request with 401 or the given status code.
 *
 * @param res
 * @param status
 */
const rejectRequest = (res: Response,
                       logger: Logger,
                       status: number = HttpStatus.UNAUTHORIZED): void => {

  logger.info(`Request will be rejected with status ${status}`);

  res.sendStatus(status);
};

function isCredentialsDirConfig(options: any): options is CredentialsDirConfig {
  const castedOptions = <CredentialsDirConfig> options;

  return castedOptions.credentialsDir !== undefined;
}

function isCredentialsClientConfig(options: any): options is CredentialsClientConfig {
  const castedOptions = <CredentialsClientConfig> options;

  return castedOptions.client_id !== undefined &&
         castedOptions.client_secret !== undefined;
}

function isCredentialsUserConfig(options: any): options is CredentialsUserConfig {
  const castedOptions = <CredentialsUserConfig> options;

  return castedOptions.application_username !== undefined &&
         castedOptions.application_password !== undefined;
}

function isPasswordGrantNoCredentialsDir(options: any): options is CredentialsUserClientConfig {
  const castedOptions = <CredentialsUserClientConfig> options;

  return (<PasswordCredentialsGrantConfig> options).grantType === OAuthGrantType.PASSWORD_CREDENTIALS_GRANT &&
         isCredentialsUserConfig(castedOptions) &&
         isCredentialsClientConfig(castedOptions);
}

function checkCredentialsSource(options: OAuthConfig) {
  return isCredentialsDirConfig(options) ||
         isCredentialsClientConfig(options) ||
         isPasswordGrantNoCredentialsDir(options);
}

function extractUserCredentials(options: CredentialsUserConfig | CredentialsUserClientConfig): object {
  const application_password = options.application_password;
  const application_username = options.application_username;

  return { application_password, application_username };
}

function extractClientCredentials(options: CredentialsClientConfig | CredentialsUserClientConfig): object {
  const client_id = options.client_id;
  const client_secret = options.client_secret;

  return { client_id, client_secret };
}

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

  if (options.grantType === OAuthGrantType.AUTHORIZATION_CODE_GRANT && !options.code) {
    throw TypeError('code must be defined');
  }

  if (options.grantType === OAuthGrantType.AUTHORIZATION_CODE_GRANT && !options.redirectUri) {
    throw TypeError('redirectUri must be defined');
  }

  if (options.grantType === OAuthGrantType.REFRESH_TOKEN_GRANT && !options.refreshToken) {
    throw TypeError('refreshToken must be defined');
  }
};

export {
  extractAccessToken,
  extractUserCredentials,
  extractClientCredentials,
  getBasicAuthHeaderValue,
  getFileDataAsObject,
  getHeaderValue,
  isCredentialsDirConfig,
  isCredentialsClientConfig,
  isPasswordGrantNoCredentialsDir,
  rejectRequest,
  validateOAuthConfig,
  setTokeninfo
};
