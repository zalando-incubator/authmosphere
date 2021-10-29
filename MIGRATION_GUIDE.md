# Migration guide

## Migrate from `authmosphere@2.x.x` or `authmosphere@2.x.x` to `authmosphere@2.x.x`

Change the required node version to one of the following verions, as other versions (state: October 2021) are end-of-life:

* Node.js 12.22 and above
* Node.js 14 and above
* Node.js 16 and above

## Migrate from `authmosphere@1.x.x` to `authmosphere@2.x.x`

* run `npm install --save authmosphere@~2.0.0`

### Express middlewares

#### `handleOAuthRequestMiddleware`

`handleOAuthRequestMiddleware` was renamed to [`authenticationMiddleware`](./src/express-tooling.ts) and its config parameter type `MiddlewareOptions` was renamed to `AuthenticationMiddlewareOptions`.

#### `requireScopesMiddleware`

Signature changed from:

```ts
type PrecedenceOptions = {
  precedenceFunction: PrecedenceFunction;
  precedenceErrorHandler: PrecedenceErrorHandler;
};

type requireScopesMiddleware = (scopes: string[], logger?: Logger, precedenceOptions?: PrecedenceOptions) => RequestHandler;
```

... to:

```ts
type PrecedenceOptions = {
    precedenceFunction: PrecedenceFunction;
};

type ScopeMiddlewareOptions = {
  logger?: Logger;
  onAuthorizationFailedHandler?: onAuthorizationFailedHandler;
  precedenceOptions?: PrecedenceOptions;
};

type requireScopesMiddleware = (scopes: string[], options?: ScopeMiddlewareOptions) => RequestHandler;
```

The `precedenceErrorHandler` is removed which means that errors during the execution of the middleware created by `requireScopesMiddleware` can be handled by `onAuthorizationFailedHandler`. The optional `logger` is also moved to the `ScopeMiddlewareOptions`.

### `TokenCache`

The parameter type `TokenCacheConfig` was renamed to `TokenCacheOptions` and restructured, from:

```ts
type TokenCacheConfig = {
  percentageLeft: number
};
```
... to:

```ts
type CacheConfig = {
  percentageLeft: number
};

type TokenCacheOptions = {
  cacheConfig?: CacheConfig,
  logger?: Logger
};
```

### `OAuthConfig` type

Instead of four single string values, an enum `OAuthGrantType` is exported which should be used as `grantType` in `OAuthConfig`:

```ts
type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;

type TokenCacheOAuthConfig = OAuthConfig & {
  tokenInfoEndpoint: string;
};
```

#### `OAuthGrantType`

Instead of specifying the grant type by a magic string, an enum `OAuthGrantType` is exported which should be used as `grantType` in `OAuthConfig`:

```ts
enum OAuthGrantType {
  AUTHORIZATION_CODE_GRANT = 'authorization_code',
  PASSWORD_CREDENTIALS_GRANT = 'password',
  REFRESH_TOKEN_GRANT = 'refresh_token',
  CLIENT_CREDENTIALS_GRANT = 'client_credentials'
}
```

### Mock tooling: `mockAccessTokenEndpoint`

If you use `mockAccessTokenEndpoint` and rely on the scope `uid` which is incuded by default in the returned token, you now have to explicitly request for this scope. For example, if you do a request like the following with `authmosphere@1.x.x`:

```ts
getAccessToken({
  ...,
  scopes: ['foo', 'bar']
  // or even:
  // scopes: undefined
  // or:
  // scopes: []
})
```

... the requested scopes are ignored and the returned token includes always only scope `uid`. With `authmosphere@2.x.x` the token contains exactly the scopes which were requested.

### Improved error handling

Promises returned by `getAccessToken` and `getTokenInfo` are now rejected in a consistent way with an error object like:

```ts
{
  error?: string | Error | object,
  message?: string
}
```

## Migrate from `lib-oauth-tooling@2.x.` to `authmosphere@1.x.x`

* run `npm uninstall --save lib-oauth-tooling`
* run `npm install --save authmosphere`

The signature of the function `createAuthCodeRequestUri` was changed to be better suitable for partial application. The `authorizationEndpoint` parameter was moved to the first position.
It's important to manually adjust your code to this change, since the type system is not helpful in this special case.

```typescript
function createAuthCodeRequestUri(authorizationEndpoint: string,
                                  redirectUri: string,
                                  clientId: string,
                                  queryParams?: {}): string
```

## Migrating from `lib-oauth-tooling@1.x.` to `lib-oauth-tooling@2.x.x`

If you depend on the `realm` property you now have to pass the value via the `queryParams` parameters in `OAuthConfig`:

```typescript
// will NOT work anymore:
getAccessToken({
  // all the other config
  // ...
  realm: EMPLOYEES_REALM,
})
.then(token: Token => {
  // ...
});

// instead use this:
getAccessToken({
  // all the other config
  // ...
  queryParams: { realm: '/employees' }
})
.then(token: Token => {
  // ...
});
```
