import { OAuthGrantType } from '../types';

type GrantConfigBase = {
  credentialsDir: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
};

type ClientCredentialsGrantConfig = GrantConfigBase & {
  grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT;
  scopes: string[];
};

type AuthorizationCodeGrantConfig = GrantConfigBase & {
  grantType: OAuthGrantType.AUTHORIZATION_CODE_GRANT;
  code: string;
  redirectUri: string;
  scopes: string[];
};

type PasswordCredentialsGrantConfig = GrantConfigBase & {
  grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT;
  scopes?: string[];
};

type RefreshGrantConfig = GrantConfigBase & {
  grantType: OAuthGrantType.REFRESH_TOKEN_GRANT;
  refreshToken: string;
  scopes: string[];
};

type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;

type TokenCacheOAuthConfig = OAuthConfig & {
  tokenInfoEndpoint: string; // mandatory for TokenCache
};

export {
  GrantConfigBase,
  ClientCredentialsGrantConfig,
  AuthorizationCodeGrantConfig,
  PasswordCredentialsGrantConfig,
  RefreshGrantConfig,
  OAuthConfig,
  TokenCacheOAuthConfig
};
