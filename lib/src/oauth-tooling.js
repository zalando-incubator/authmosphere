'use strict';
var NodeURL = require('url');
var HttpStatus = require('http-status');
var fetch = require('node-fetch');
var q = require('q');
var fs = require('fs');
var btoa = require('btoa');
var formurlencoded = require('form-urlencoded');
const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';
const AUTHORIZATION_BEARER_PREFIX = 'Bearer';
const AUTHORIZATION_BASIC_PREFIX = 'Basic';
const USER_JSON = 'user.json';
const CLIENT_JSON = 'client.json';
const OAUTH_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const AUTHORIZATION_CODE_GRANT = 'authorization_code';
exports.AUTHORIZATION_CODE_GRANT = AUTHORIZATION_CODE_GRANT;
const PASSWORD_CREDENTIALS_GRANT = 'password';
exports.PASSWORD_CREDENTIALS_GRANT = PASSWORD_CREDENTIALS_GRANT;
const fsReadFile = q.denodeify(fs.readFile);
/**
 * Returns a promise with the user object (as json) containing the user credentials.
 *
 * @param filePath
 * @param fileName
 * @returns {Promise<any>}
 */
function getFileData(filePath, fileName) {
    if (filePath.substr(-1) !== '/') {
        filePath += '/';
    }
    return fsReadFile(filePath + fileName, 'utf-8');
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
function requestAccessToken(bodyObject, authorizationHeaderValue, accessTokenEndpoint, realm) {
    return fetch(accessTokenEndpoint + '?realm=' + realm, {
        method: 'POST',
        body: formurlencoded(bodyObject),
        headers: {
            'Authorization': authorizationHeaderValue,
            'Content-Type': OAUTH_CONTENT_TYPE
        }
    })
        .then((res) => {
        return res.json();
    })
        .then((json) => {
        return json.access_token;
    })
        .catch((err) => {
        console.error('Could not get access token from server: ' + accessTokenEndpoint, err);
    });
}
/**
 * Checks whether a given url matches one of a set of given patterns.
 *
 * @param url
 * @param patterns
 * @returns {boolean}
 */
function match(url, patterns) {
    let isPatternMatch = false;
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
function header(req, field) {
    if (req && field && req.headers.hasOwnProperty(field)) {
        return req.headers[field];
    }
    else {
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
function getBasicAuthHeaderValue(client_id, client_secret) {
    return AUTHORIZATION_BASIC_PREFIX + ' ' + btoa(client_id + ':' + client_secret);
}
/**
 * Extracts and returns an access_token from an authorization header
 *
 * @param authHeader
 * @returns {any}
 */
function extractAccessToken(authHeader) {
    const parts = authHeader.split(' ');
    // if type is bearer
    if (parts[0] === AUTHORIZATION_BEARER_PREFIX && parts.length === 2) {
        return parts[1];
    }
    else {
        return undefined;
    }
}
function getTokenInfoFromServer(authServerUrl, accessToken, res) {
    const promise = new Promise(function (resolve, reject) {
        // Get token info from oauth server
        // and then start validation
        fetch(NodeURL.format(authServerUrl) + '?access_token=' + accessToken)
            .then(response => {
            if (response.status !== 200) {
                return reject({
                    status: HttpStatus.UNAUTHORIZED,
                    resObj: res
                });
            }
            else {
                return response.json();
            }
        })
            .then((data) => {
            return resolve({
                response: res,
                data: data
            });
        })
            .catch(err => {
            return reject({
                errorResponse: err,
                resObj: res
            });
        });
    });
    return promise;
}
// TODO: how to validate?
/**
 * Validates an acces token from the token endpoint.
 *
 * Example token:
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
 *
 * @param response
 * @returns {any}
 */
function validateToken(response) {
    /*const tokenInfo = response.data;
    const res = response.cfgobj;
  
    // uid should match with the resource owner
    if (tokenInfo.uid !== 'services') {
      throw {
        response: res,
        status: HttpStatus.FORBIDDEN
      };
    } else {
      return response;
    }*/
    return response;
}
/**
 * Attach the user scopes on the req object for later validation.
 *
 * @param req
 * @returns {function(any): undefined}
 */
function setScopes(req) {
    return function (response) {
        const tokenInfo = response.data;
        req.scopes = tokenInfo.scope;
    };
}
/**
 * Reject a request with 401 or the given status code.
 *
 * @param res
 * @param status
 */
function rejectRequest(res, status) {
    let _status = status ? status : HttpStatus.UNAUTHORIZED;
    res.sendStatus(_status);
}
/**
 * Specifies the scopes needed to access this endpoint.
 *
 * Returns a function that validates the scopes against the
 * user scopes attached to the request.
 *
 * Usage:
 *  route.get('/path', requireScopes['scopeA', 'scopeB'], () => { // Do route work })
 *
 * @param scopes
 * @returns {function(any, any, any): undefined}
 */
function requireScopes(scopes) {
    return function (req, res, next) {
        const userScopes = new Set(req.scopes || []);
        const requiredScopes = new Set(scopes || []);
        let userScopesMatchRequiredScopes = true;
        if (userScopes.size !== requiredScopes.size) {
            userScopesMatchRequiredScopes = false;
        }
        else {
            for (let scope of userScopes) {
                if (!requiredScopes.has(scope)) {
                    userScopesMatchRequiredScopes = false;
                }
            }
        }
        if (userScopesMatchRequiredScopes) {
            next();
        }
        else {
            rejectRequest(res, 403);
        }
    };
}
exports.requireScopes = requireScopes;
/**
 * Helper function to get an access token for the specified scopes.
 *
 * Currently supports the following OAuth flows (specified by the `grant_type` property):
 *  - Resource Owner Password Credentials Grant (PASSWORD_CREDENTIALS_GRANT)
 *  - Authorization Code Grant (AUTHORIZATION_CODE_GRANT)
 *
 *  The options object can have the following properties:
 *  - credentialsDir string
 *  - grant_type string
 *  - accessTokenEndpoint string
 *  - realm string
 *  - scopes string optional
 *  - redirect_uri string optional
 *  - code string optional
 *
 * @param scopes
 * @param options
 * @returns {any}
 */
function getAccessToken(options) {
    return Promise.all([
        getFileData(options.credentialsDir, USER_JSON),
        getFileData(options.credentialsDir, CLIENT_JSON) //client data
    ]).then((credentials) => {
        const userData = JSON.parse(credentials[0]);
        const clientData = JSON.parse(credentials[1]);
        let bodyParameters;
        if (options.grant_type === PASSWORD_CREDENTIALS_GRANT) {
            bodyParameters = {
                'grant_type': options.grant_type,
                'username': userData.application_username,
                'password': userData.application_password,
                'scope': options.scopes
            };
        }
        else if (options.grant_type === AUTHORIZATION_CODE_GRANT) {
            bodyParameters = {
                'grant_type': options.grant_type,
                'code': options.code,
                'redirect_uri': options.redirect_uri
            };
        }
        const authorizationHeaderValue = getBasicAuthHeaderValue(clientData.client_id, clientData.client_secret);
        return requestAccessToken(bodyParameters, authorizationHeaderValue, NodeURL.format(options.accessTokenEndpoint), options.realm);
    })
        .catch((err) => {
        console.error('Unable to read credentials', err);
    });
}
exports.getAccessToken = getAccessToken;
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
 * app.use(handleAuthorziationBearer(options))
 *
 * @param options
 * @returns {function(any, any, any): undefined} express middleware
 */
function handleAuthorziationBearer(options) {
    return function (req, res, next) {
        // Skip OAuth validation for paths marked as public
        if (match(req.originalUrl, options.publicEndpoints)) {
            return next();
        }
        const accessToken = extractAccessToken(header(req, AUTHORIZATION_HEADER_FIELD_NAME));
        if (!accessToken) {
            rejectRequest(res);
        }
        else {
            getTokenInfoFromServer(options.tokenInfoEndpoint, accessToken, res)
                .then(validateToken)
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
exports.handleAuthorziationBearer = handleAuthorziationBearer;
//# sourceMappingURL=oauth-tooling.js.map