import { OAuthGrantType } from '../types';

type CredentialsDirConfig = {
  credentialsDir: string;
};

type CredentialsClientConfig = {
  clientId: string,
  clientSecret: string
};

type CredentialsUserConfig = {
  applicationUsername: string,
  applicationPassword: string
};

type CredentialsUserClientConfig = CredentialsClientConfig & CredentialsUserConfig;

type CredentialsConfig = CredentialsDirConfig | CredentialsClientConfig;
type CredentialsPasswordConfig = CredentialsDirConfig | CredentialsUserClientConfig;

type GrantConfigBase = {
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
};

type ClientCredentialsGrantConfig = CredentialsConfig & GrantConfigBase & {
  grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT;
};

type AuthorizationCodeGrantConfig = CredentialsConfig & GrantConfigBase & {
  grantType: OAuthGrantType.AUTHORIZATION_CODE_GRANT;
  code: string;
  redirectUri: string;
};

type PasswordCredentialsGrantConfig = CredentialsPasswordConfig & GrantConfigBase & {
  grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT;
};

type RefreshGrantConfig = CredentialsConfig & GrantConfigBase & {
  grantType: OAuthGrantType.REFRESH_TOKEN_GRANT;
  refreshToken: string;
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
  CredentialsUserConfig,
  CredentialsClientConfig,
  CredentialsUserClientConfig,
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
