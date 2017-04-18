interface OAuthConfig {
  credentialsDir: string;
  grantType: string; // (`AUTHORIZATION_CODE_GRANT` | `PASSWORD_CREDENTIALS_GRANT`)
  accessTokenEndpoint: string;
  tokenInfoEndpoint?: string;
  realm: string; // (`SERVICES_REALM` | `EMPLOYEES_REALM`)
  scopes?: string;
  redirect_uri?: string; // (required with `AUTHORIZATION_CODE_GRANT`)
  code?: string; // (required with `AUTHORIZATION_CODE_GRANT`)
  redirectUri?: string;
}
