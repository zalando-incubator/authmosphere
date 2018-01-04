# Migration guide

## Migrate from `authmosphere@1.0.x` to `authmosphere@2.0.y`

**TODO**

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
