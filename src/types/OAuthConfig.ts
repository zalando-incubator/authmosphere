import { OAuthGrantType } from '../types';

type CredentialsDirConfig = {
  credentialsDir: string;
};

type PassCredentialsClientConfig = {
  client_id: string,
  client_secret: string
};

type PassCredentialsUserConfig = {
  application_username: string,
  application_password: string
};

type CredentialsConfig = CredentialsDirConfig | PassCredentialsClientConfig;
type CredentialsPasswordConfig = CredentialsDirConfig | PassCredentialsClientConfig & PassCredentialsUserConfig;

type GrantConfigBase = {
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
};

type ClientCredentialsGrantConfig = CredentialsConfig & GrantConfigBase & {
  grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT;
  scopes: string[];
};

type AuthorizationCodeGrantConfig = CredentialsConfig & GrantConfigBase & {
  grantType: OAuthGrantType.AUTHORIZATION_CODE_GRANT;
  code: string;
  redirectUri: string;
  scopes: string[];
};

type PasswordCredentialsGrantConfig = CredentialsPasswordConfig & GrantConfigBase & {
  grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT;
  scopes?: string[];
};

type RefreshGrantConfig = CredentialsConfig & GrantConfigBase & {
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
  CredentialsDirConfig,
  PassCredentialsUserConfig,
  PassCredentialsClientConfig,
  CredentialsPasswordConfig,
  CredentialsConfig,
  GrantConfigBase,
  ClientCredentialsGrantConfig,
  AuthorizationCodeGrantConfig,
  PasswordCredentialsGrantConfig,
  RefreshGrantConfig,
  OAuthConfig,
  TokenCacheOAuthConfig
};
