'use strict';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  createAuthCodeRequestUri,
  getAccessToken,
  getTokenInfo
} from './oauth-tooling';

import {
  TokenCache
} from './TokenCache';

import {
  PASSWORD_CREDENTIALS_GRANT,
  AUTHORIZATION_CODE_GRANT,
  SERVICES_REALM,
  EMPLOYEES_REALM
} from './constants';

import {
  mockAccessTokenEndpoint,
  mockTokeninfoEndpoint,
  cleanMock
} from './mock-tooling/index'

export {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  createAuthCodeRequestUri,
  getAccessToken,
  getTokenInfo,
  TokenCache,
  PASSWORD_CREDENTIALS_GRANT,
  AUTHORIZATION_CODE_GRANT,
  SERVICES_REALM,
  EMPLOYEES_REALM,
  mockAccessTokenEndpoint,
  mockTokeninfoEndpoint,
  cleanMock
};
