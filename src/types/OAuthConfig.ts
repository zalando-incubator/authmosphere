type CredentialsDirConfig = {
  credentialsDir: string
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
  grantType: string,
  accessTokenEndpoint: string,
  queryParams?: { [index: string]: string },
  bodyParams?: { [index: string]: string },
  scopes?: string[]
};

type ClientCredentialsGrantConfig = CredentialsConfig & GrantConfigBase;

type AuthorizationCodeGrantConfig = CredentialsConfig & GrantConfigBase & {
  code: string,
  redirectUri: string
};

type PasswordCredentialsGrantConfig = CredentialsPasswordConfig & GrantConfigBase;

type RefreshGrantConfig = CredentialsConfig & GrantConfigBase & {
  refreshToken: string
};

type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;

type TokenCacheOAuthConfig =
  (ClientCredentialsGrantConfig | PasswordCredentialsGrantConfig) & {
    tokenInfoEndpoint: string // mandatory for TokenCache
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
