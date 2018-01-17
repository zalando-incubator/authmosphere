# Migration guide

## Migrate from `authmosphere@1.0.x` to `authmosphere@2.0.y`

### Upgrade

* run `npm install --save authmosphere@~2.0.0`

### General changes

* All exported functions got support for a custom logger. Providing a logger is optional.
  Any logger need to satisfy the [Logger](./src/types/Logger.ts) interface.
  * If a logging framework does not satisfy the interface, it need to be wrapped for authmosphere.
* To keep arguments lists short, `option` objects were introduced to group a number of (mostly) optional parameters.



### Express middlewares

* `handleOAuthRequestMiddleware` was renamed to [`authenticationMiddleware`](./src/express-tooling.ts)
  * config parameter `MiddlewareOptions` was renamed to `AuthenticationMiddlewareOptions`
  * an optional logger can be provided ([`Logger`](./src/types/Logger.ts))
  * an optional `onNotAuthenticatedHandler` can be provided, it helps to customize handling the case authentication fails

* `requireScopesMiddleware`
  * added optional `options` object of type [`ScopeMiddlewareOptions`](./src/types/ScopeMiddlewareOptions.ts)
    * an optional logger can be provided ([`Logger`](./src/types/Logger.ts))
    * an optional `onAuthorizationFailedHandler` can be provided, it helps to customize handling the case authentication fails
  * moved `precedenceOptions` parameter into `options` parameter
    * `precedenceErrorHandler` got removed from [`PrecedenceOptions`](./src/types/Precedence.ts).
      `onAuthorizationFailedHandler` should be used instead.

### Improved `OAuthConfig` type

Instead of providing one bulky type for all OAuth2 grants the type `OAuthConfig` is split up into a union type of all supported grants. A type for the `TokenCache` config (`TokenCacheOAuthConfig`) is also derived:

```ts
type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;

type TokenCacheOAuthConfig = OAuthConfig & {
  tokenInfoEndpoint: string; // mandatory for TokenCache
};
```

Additionally, it is now possible to provide client (and user) credentials as a `string` instead of just via a `credentialsDir`:

```ts
const config: OAuthConfig = {
  ...,
  clientId,
  clientSecret,
  applicationUsername,
  applicationPassword
};
```

For detailed information have a look at the implementation of [`OAuthConfig`](./src/types/OAuthConfig.ts).

### Improved `OAuthGrantType`

Instead of specifying the grant type by a magic string, an enum `OAuthGrantType` is exported which should be used as `grantType` in `OAuthConfig`:

```ts
enum OAuthGrantType {
  AUTHORIZATION_CODE_GRANT = 'authorization_code',
  PASSWORD_CREDENTIALS_GRANT = 'password',
  REFRESH_TOKEN_GRANT = 'refresh_token',
  CLIENT_CREDENTIALS_GRANT = 'client_credentials'
}
```

### Improved error handling

Promises returned by `getAccessToken` and `getTokenInfo` are now rejected in a consistent way with an error object like:

```ts
{
  error?: string | Error | object,
  message?: string
}
```

### New mocking function `mockEndpointWithErrorResponse`

The library now exports `mockEndpointWithErrorResponse` which allows to mock an OAuth endpoint with an error response to be able to test behaviour in error case more precisley:

```
mockEndpointWithErrorResponse(options: MockOptions, httpStatus: number, responseBody?: object): void
```

### TODO undocumented breaking migration steps

* [improve oauth config type](https://github.com/zalando-incubator/authmosphere/commit/4fd53430ccb19cb2553d0114e0b748e062202a14)
* [improve error handling](https://github.com/zalando-incubator/authmosphere/commit/afdcfa9a8619c0be4c39a22fd9353d086aa0364d)
* [mock failing server](https://github.com/zalando-incubator/authmosphere/commit/2a68e18bcc08d1b3e2fdfc7f5472e99bc28a1a16)
* [accept optional body params](https://github.com/zalando-incubator/authmosphere/commit/25aee2978dded718d93849c829411c65624a98f6)
* [Extract scopes from body in mock (#157) ](https://github.com/zalando-incubator/authmosphere/commit/d3961030cf1a5d498b6d960e26f4bb08d3a440a0)
  * 'uid' scope has to be provided excplitly now
* [feat(token-cache): optional logger (#156) ](https://github.com/zalando-incubator/authmosphere/commit/1f7e8103f957aa19c792154e1cf2601e9117065d)


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
