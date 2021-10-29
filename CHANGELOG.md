# Changelog

## `authmosphere 4.0.0`

* Due to some dependency updates like Eslint, Node.js 10, 13, and 15 are no longer supported (see also [Eslint 8.0.0 migration guide](https://eslint.org/docs/8.0.0/user-guide/migrating-to-8.0.0))
* Minor change in logging, to ensure a higher compatibility to multiple usable loggers

## `authmosphere 3.0.4`

* updated nock and eslint
* added ```.npmrc``` for reliable builds

## `authmosphere 3.0.3`

* fix linting error

## `authmosphere 3.0.2 (unreleased)`

* remove the last left over dependencies and files for TSLint
* fix npm task
* Change type ```Record<string, unknown>``` to ```Record<string | number | symbol, unknown>``` to support the full range of possible keys within an ```object```

## `authmosphere 3.0.1 (unreleased)`

* security updates and dependency updates

## `authmosphere 3.0.0 (prerelaesed)`

This release is mostly about dependency updates and cleaning up, and probably non-breaking. However there are some types affected by changes due to an updated TypeScript version so we are not 100% sure about this. If you identify breaking behaviour/changes in this release, feel free to reach out to us.

Additional information 29.01.2021
We removed as highly encouraged within Typescript the type ```{}``` by the type ```Record<string | number | symbol, unknown>``` in an exported interface. Meanwhile, we assume the interface is not breaking and experienced no problems since release.

Nevertheless we dropped the support for some older and unsupported Node versions with the first official release of this mayor version.

## `authmosphere 2.0.0` - **BREAKING**

### General changes

The following functions got support for an optional logger:

* `TokenCache` (via [`TokenCacheOptions`](./src/types/TokenCacheConfig.ts) parameter)
* `getTokenInfo` (via `logger` parameter)
* `getAccessToken` (via `logger` parameter)
* `authenticationMiddleware` (via [`AuthenticationMiddlewareOptions`](./src/types/AuthenticationMiddlewareOptions.ts) parameter)
* `requireScopesMiddleware` (via [`ScopeMiddlewareOptions`](./src/types/ScopeMiddlewareOptions.ts) parameter)

Providing a logger is optional. Any logger needs to satisfy the [Logger](./src/types/Logger.ts) interface.
To keep arguments lists short, `option` objects were introduced to group a number of (mostly) optional parameters.

### Express middlewares

* `handleOAuthRequestMiddleware` was renamed to [`authenticationMiddleware`](./src/express-tooling.ts)
  * Config parameter `MiddlewareOptions` was renamed to `AuthenticationMiddlewareOptions`
  * An optional logger can be provided ([`Logger`](./src/types/Logger.ts))
  * An optional `onNotAuthenticatedHandler` can be provided, which let you explicitly handle the case when authentication fails. Important note: if `onNotAuthenticatedHandler` is defined you are responsible to handle the request yourself (e.g. calling `response.sendStatus(code)` or `next()`).

* `requireScopesMiddleware`
  * Added optional `options` object of type [`ScopeMiddlewareOptions`](./src/types/ScopeMiddlewareOptions.ts)
    * An optional logger can be provided ([`Logger`](./src/types/Logger.ts))
    * An optional `onAuthorizationFailedHandler` can be provided, which let you explicitly handle the case when authentication fails. Important note: if `onAuthorizationFailedHandler` is defined you are responsible to handle the request yourself (e.g. calling `response.sendStatus(code)` or `next()`).
  * Moved `precedenceOptions` parameter into `options` parameter
    * `precedenceErrorHandler` got removed from [`PrecedenceOptions`](./src/types/Precedence.ts). `onAuthorizationFailedHandler` should be used instead.

### Changed `TokenCache` parameter type

The `TokenCacheConfig` parameter type is now called `TokenCacheOptions` and looks like:

```ts
type CacheConfig = {
  percentageLeft: number
};

type TokenCacheOptions = {
  cacheConfig?: CacheConfig,
  logger?: Logger
};
```

### Improved `OAuthConfig` type

#### Restructuring

Instead of providing one bulky type for all OAuth2 grants the type `OAuthConfig` is split up into a union type of all supported grants. A type for the `TokenCache` config (`TokenCacheOAuthConfig`) is also derived:

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

#### Passing optional body parameters

It is now possible to provide an optional object `bodyParams` which will be appended to the request body when requesting a token (via `getAccessToken` or `TokenCache`):

```ts
const config: OAuthConfig = {
  ...,
  bodyParams: {
    business_partner_id: 'xxx-xxx-xxx'
  }
};
```

#### Passing credentials

It is now possible to provide client (and user) credentials as a `string` instead of just via a `credentialsDir`:

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

#### Improved `OAuthGrantType`

Instead of four single string values, an enum `OAuthGrantType` is exported which should be used as `grantType` in `OAuthConfig`:

```ts
enum OAuthGrantType {
  AUTHORIZATION_CODE_GRANT = 'authorization_code',
  PASSWORD_CREDENTIALS_GRANT = 'password',
  REFRESH_TOKEN_GRANT = 'refresh_token',
  CLIENT_CREDENTIALS_GRANT = 'client_credentials'
}
```

### More specific typing in `createAuthCodeRequestUri`

The type for the optional parameter `queryParams` is changed from `{}` to the more specific `{ [index: string]: string }`.

### Mock tooling

#### `mockAccessTokenEndpoint` respects scopes property

Before this release, `mockAccessTokenEndpoint` always includes `uid` as value of the `scopes` property in the returned token. Now, `mockAccessTokenEndpoint` includes the scopes which were requested by the HTTP request. A request like:

```ts
getAccessToken({
  ...,
  scopes: ['uid', 'test']
})
```

...will lead to a response with a token which includes the scopes `uid` and `test`. If no `scopes` are requested, the `scopes` property of the token will be `undefined`.

#### `mockTokeninfoEndpoint` parameters

Token was moved out of `MockOptions` into a separate parameter: `mockTokeninfoEndpoint(options: MockOptions, tokens?: Token[]): nock.Scope`.

#### New functionality to test OAuth behavior in case of error

##### mockWithErrorResponse

The library now exports `mockTokeninfoEndpointWithErrorResponse` and `mockAccessTokenEndpointWithErrorResponse` which allow to mock an OAuth endpoint with an error response to be able to test behaviour in error case more accurate:

```ts
mockTokeninfoEndpointWithErrorResponse(options: MockOptions, httpStatus: number, responseBody?: object): void
mockAccessTokenEndpointWithErrorResponse(options: MockOptions, httpStatus: number, responseBody?: object): void
```

Both functions set up a HTTP mock via [nock](https://github.com/node-nock/nock). A request to the mocked url (defined via [`MockOptions`](./src/types/MockOptions.ts)) will lead to a response with the given `httpStatus` and, if defined, `responseBody` (otherwise `{}`).

### Improved error handling

Promises returned by `getAccessToken` and `getTokenInfo` are now rejected in a consistent way with an error object like:

```ts
{
  error?: string | Error | object,
  message?: string
}
```

---

## `authmosphere 1.0.0` - **BREAKING**

The project was renamed from `lib-oauth-tooling` to `authmosphere`. In the course of this renaming versioning was restarted at `1.0.0`.
Modified signature of `createAuthCodeRequestUri`, see migration guide for more information.

---

## `lib-oauth-tooling 2.0.0` - **BREAKING**

The (zalando-specific) `realm` property was removed from `OAuthConfig`. Also, the corresponding constants (`SERVICES_REALM` and `EMPLYEES_REALM`) were removed. Instead, you can add the realm (and arbitrary other query parameters) via the `queryParams` property in `OAuthConfig`.

## `lib-oauth-tooling 1.0.0` - **BREAKING**

The signature of `requireScopesMiddleware` is now incompatible with previous versions, `precedenceFunction?` is now part of `precedenceOptions?`.
