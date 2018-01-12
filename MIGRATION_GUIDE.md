# Migration guide

## Migrate from `authmosphere@1.0.x` to `authmosphere@2.0.y`

### Upgrade

* call `npm install --save authmosphere@~2.0.0`

### General changes

* All exported functions got support for a custom Logger. Providing a logger is optional.
  Any logger need to statisfy the [Logger](./src/types/Logger.ts) interface.
  * If a logging framework does not satisfy the interface, it need to be wrapped for authmosphere. (TODO: Question provide example here?)
* To keep arguments lists short, `option` objects were introduced to group a number of (mostly) optional parameters.


### express middlewares

* `handleOAuthRequestMiddleware` was renamed to [`authenticationMiddleware`](./src/express-tooling.ts)
  * config parameter `MiddlewareOptions` was renamed to `AuthenticationMiddlewareOptions`
  * an optional logger can be provided ([Logger](./src/types/Logger.ts))
  * an optional `onNotAuthenticatedHandler` can be provided, it helps to customize handling the case authentication fails

* `requireScopesMiddleware`
  * added optional `options` object of type [`ScopeMiddlewareOptions`](./src/types/ScopeMiddlewareOptions.ts)
    * an optional logger can be provided ([Logger](./src/types/Logger.ts))
    * an optional `onAuthorizationFailedHandler` can be provided, it helps to customize handling the case authentication fails
  * moved `precedenceOptions` parameter into `options` parameter
    * `precedenceErrorHandler` got removed from [`PrecedenceOptions`](./src/types/Precedence.ts).
      `onAuthorizationFailedHandler` should be used instead.

## Migrate from `lib-oauth-tooling@2.x.` to `authmosphere@1.x.x`

* call `npm uninstall --save lib-oauth-tooling`
* call `npm install --save authmosphere`

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
