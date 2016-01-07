'use strict';


import { OAuthConfiguration } from './OAuthConfiguration';
import * as express from 'express';
import * as NodeURL from 'url';
import * as HttpStatus from 'http-status';
import * as fetch from 'node-fetch';
import * as q from 'q';
import * as fs from 'fs';
import * as btoa from 'btoa'; //base64 encoding

const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';
const AUTHORIZATION_BEARER_PREFIX = 'Bearer';
const BASIC = 'Basic ';
const USER_JSON = 'user.json';
const CLIENT_JSON = 'client.json';
const GRANT_TYPE = 'password';

const fs_readFile = q.denodeify<any>(fs.readFile)

/**
 * @return a promise with the user object (as json) containing the user credentials.
 */
function getFileData(filePath: string, fileName: string): q.Promise<any> {
  if (filePath.substr(-1) !== '/') { // substr operates with the length of the string
    filePath += '/';
  }

  return fs_readFile(filePath + fileName, 'utf-8');
}

/**
 * @return the access token from the given server if the user credentials are valid.
 */
function getAccessToken(userRequest: any, clientCredentialsBase64: any, serverUrl: string, scopes: string): Promise<string> {

  const headerValue = BASIC + clientCredentialsBase64;

  return fetch(serverUrl, {method: 'POST', body: JSON.stringify(userRequest), headers: {'Authorization': headerValue}})
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    return json.access_token;
  })
  .catch((err) => {
    console.error("Could not get access token from server: " + serverUrl, err);
  });
}

function match(url: string, patterns: Set<string>): boolean {

  var isPatternMatch: boolean = false;

  patterns.forEach((pattern) => {
    if (url.startsWith(pattern)) {
      isPatternMatch = true;
    }
  });

  return isPatternMatch;
}

function skip(shouldSkip :boolean, next: Function): boolean {
  if (shouldSkip){
    next();
    return true;
  }
}

function header(req: express.Request, field: string) {
  if (req && field && req.headers.hasOwnProperty(field)) {
    return req.headers[field];
  } else {
    return '';
  }
}

function accessToken(authHeader: string): string {

  const parts = authHeader.split(' ');

  // IF TYPE IS bearer
  if (parts[0] === AUTHORIZATION_BEARER_PREFIX && parts.length === 2) {
    return parts[1];
  } else {
    return undefined;
  }
}

function setHeaderToRequest(req, tokenInfo: Object, accessToken: string) {
  req.authInfo = tokenInfo;
  req.authToken = accessToken;
}

function getTokenInfoFromServer(authServerUrl: NodeURL.Url,
                                 accessToken: string,
                                 res): Promise<any> {

  const promise = new Promise(function(resolve, reject) {

    var options = {
      method: 'GET'
    }

    // Get token info from oauth server
    // and then start validation
    fetch(NodeURL.format(authServerUrl) + '?access_token=' + accessToken, options)
    .then( response => {
      if (response.status != 200) {
        return reject ({
          status: HttpStatus.UNAUTHORIZED,
          resObj: res
        });
      } else {
        return response.json();
      }
    })
    .then((data) => {
      return resolve({
        response: res,
        data: data
      });
    })
    .catch( err => {
      return reject ({
        errorResponse: err,
        resObj: res
      });
    });
  });

  return promise;
}


/**
 * {
 *  "expires_in": 3515,
 *  "token_type": "Bearer",
 *  "realm": "employees",
 *  "scope": [
 *    "uid"
 *   ],
 *  "grant_type": "password",
 *  "uid": "yourusername",
 *  "access_token": "4b70510f-be1d-4f0f-b4cb-edbca2c79d41"
 * }
 */
function validateToken(cfg: any) {
  const tokenInfo = cfg.data;
  const res = cfg.cfgobj;

  // uid should match with the resource owner
  if (tokenInfo.uid !== 'services') {
    throw {
      response: res,
      status: HttpStatus.FORBIDDEN
    };
  } else {
    return cfg;
  }
}

/**
 * Attach the user scopes on the req object for later validation
 */
function setScopes(req, res) {
  return function(cfg: any) {
    const tokenInfo = cfg.data;
    req.scopes = tokenInfo.scope;
  }
}

/**
 * Specifies the scopes needed to access this endpoint.
 *
 * Returns a function that validates the scopes against the
 * user scopes attached to the request.
 *
 * Usage:
 *  route.get('/path', requireScopes['scopeA', 'scopeB'], () => { // Do route work })
 */
function requireScopes(scopes: string[]) {
  return function(req, res, next) {

    const userScopes     = new Set<String>(req.scopes || []);
    const requiredScopes = new Set<String>(scopes || []);

    var userScopesMatchRequiredScopes = true;

    if (userScopes.size !== requiredScopes.size) {
      userScopesMatchRequiredScopes = false;
    } else {
      for (var scope of userScopes) {
        if (!requiredScopes.has(scope)) {
          userScopesMatchRequiredScopes = false;
        }
      }
    }

    if(userScopesMatchRequiredScopes) {
      next();
    } else {
      rejectRequest(res, 403);
    }
  }
}

/**
 * Reject a request with 401 or the given status code.
 */
function rejectRequest(res, status?:number) {

  var _status = status ? status : HttpStatus.UNAUTHORIZED;

  res.sendStatus(_status);
}

/**
 * A OAuth 2.0 middleware for Express 4.0.
 */
class OAuthService {

  private oauthConfig: OAuthConfiguration;

  public getBearer(scopes: string): Promise<string> {

    const self = this;

    const accessTokenPromis: any = Promise.all([
      getFileData(this.oauthConfig.credentialsDir, USER_JSON), //user data
      getFileData(this.oauthConfig.credentialsDir, CLIENT_JSON)  //client data
    ]).then((credentials) => {

      const userData = JSON.parse(credentials[0]);
      const clientData = JSON.parse(credentials[1]);

      const userRequest = {
        "grant-type": GRANT_TYPE,
        "username": userData.application_username,
        "password": userData.application_password,
        "scope": scopes
      };

      const clientCredentialsBase64 = btoa(clientData.client_id + ":" + clientData.client_secret);

      return getAccessToken(userRequest, clientCredentialsBase64, NodeURL.format(self.oauthConfig.authServerUrl), scopes);
    })
    .catch((err) => {
      console.error('Unable to read credentials', err);
    });

    return accessTokenPromis;
  }

  public oauthMiddleware() {

    const self = this;

    return function(req: any, res: any, next: any) {

      // Skip OAuth checking for paths marked as public
      if (skip(match(req.originalUrl, self.oauthConfig.publicEndpoints), next)) {
        return;
      }

      const _accessToken = accessToken(header(req, AUTHORIZATION_HEADER_FIELD_NAME));
      if (!_accessToken) {
        rejectRequest(res);
        return;
      }

      getTokenInfoFromServer(self.oauthConfig.authServerUrl,
                             _accessToken,
                             res)
      .then(validateToken)
      .then(setScopes(req, res))
      .then(() => {
        next();
      })
      .catch((err) => {
        rejectRequest(res, err.status);
      });
    }
  }

  constructor(config: OAuthConfiguration) {

    if (config) {
      this.oauthConfig = config;
    } else {
      throw new Error('Missing OAuthConfiguration.');
    }
  }
}

export { OAuthService, requireScopes }
