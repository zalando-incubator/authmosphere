# authmosphere

[![Build Status](https://travis-ci.org/zalando-incubator/authmosphere.svg)](https://travis-ci.org/zalando-incubator/authmosphere)
[![Coverage Status](https://coveralls.io/repos/github/zalando-incubator/authmosphere/badge.svg)](https://coveralls.io/github/zalando-incubator/authmosphere)
[![npm download](https://img.shields.io/npm/dm/authmosphere.svg?style=flat-square)](https://www.npmjs.com/package/authmosphere)
[![npm version](https://img.shields.io/npm/v/authmosphere.svg?style=flat)](https://www.npmjs.com/package/authmosphere)

## Introduction

`{authmosphere}` is a library to support OAuth2 workflows in JavaScript projects.

It's implemented in TypeScript which improves the development experience via implicit documentation with types, first-class IDE support and provides mock tooling for local development. The library itself is transpiled to JavaScript (ES6) so there is no need for a TypeScript compiler to use authmosphere in JavaScript projects.

Currently the following flows are supported:

* [Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-1.3.1)
* [Resource Owner Password Credentials Grant](https://tools.ietf.org/html/rfc6749#section-1.3.3)
* [Refresh token Grant](https://tools.ietf.org/html/rfc6749#section-6)
* Express middlewares to simplify authentication/authorization
* `TokenCache` service to manage access tokens in your application

See [STUPS documentation](http://stups.readthedocs.org/en/latest/user-guide/access-control.html#implementing-a-client-asking-resource-owners-for-permission) and [OAuth2 documentation](https://tools.ietf.org/html/rfc6749) for more information.

## Project renaming

The project was renamed from `lib-oauth-tooling` to `authmosphere`. In the course of this renaming versioning was restarted at `0.1.0`. Version `1.0.0` is soon to be released, keep track of the progess in [#92](https://github.com/zalando-incubator/lib-oauth-tooling/issues/92), this release will contain breaking changes.

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

See the [changelog](#changelog) for more information.

## Usage

Note: `node >= 6.0.0` required to consume this library.

Run `npm install authmosphere`.

Import a member of this lib like so (of course ES5 syntax is working as well...):


```typescript
import {
  TokenCache,
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  ...
} from 'authmosphere';
```

#### TokenCache(tokenConfig: { [key: string]: string[] }, oauthConfig: OAuthConfig)

Class to request and cache tokens on client-side.

```typescript
const tokenCache = new TokenCache({
  'service-foo': ['foo.read', 'foo.write'],
  'service-bar': ['bar.read']
}, oAuthConfig);

tokenCache.get('service-foo')
.then((token: Token) => {
  console.log(token.access_token);
});
```

`oauthConfig`:
* `credentialsDir` string
* `grantType` string (`AUTHORIZATION_CODE_GRANT` | `PASSWORD_CREDENTIALS_GRANT`)
* `accessTokenEndpoint` string
* `tokenInfoEndpoint` string - mandatory for TokenCache
* `scopes` string[] optional
* `queryParams` {} optional
* `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
* `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)

#### handleOAuthRequestMiddleware(options: MiddlewareOptions)

Express middleware to extract and validate an access token. It attaches the scopes matched by the token to the request (`request.scopes`) for further usage.
If the token is not valid the request is rejected (with 401 Unauthorized).

```typescript
app.use(handleOAuthRequestMiddleware({
  publicEndpoints: ['/heartbeat', '/status'],
  tokenInfoEndpoint: 'auth.example.com/tokeninfo'
});
```

`options`:
* `publicEndpoints` string[]
* `tokenInfoEndpoint` string

#### requireScopesMiddleware(scopes: string[])

Specifies the scopes needed to access an endpoint. Assumes that there is an `request.scopes` property (as attached by `handleOAuthRequestMiddleware`) to match the required scopes against.
If the the requested scopes are not matched request is rejected (with 403 Forbidden).

```typescript
app.get('/secured/route', requireScopesMiddleware(['scopeA', 'scopeB']), (request, response) => {
  // do your work...
})
```

#### getTokenInfo(tokenInfoEndpoint: string, accessToken: string): Promise<Token>

Makes a request to the `tokenInfoEndpoint` to validate the given `accessToken`.

```typescript
getTokenInfo(tokenInfoEndpoint, accessToken)
.then((token: Token) => {
  console.log(token.access_token);
})
.catch((err) => {
  console.log(err);
});
```

Type `Token` is defined like:

```typescript
interface Token {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
  [key: string]: {};
}
```

#### getAccessToken(options: OAuthConfig): Promise<Token>

Helper function to get an access token for the specified scopes.

```typescript
getAccessToken(options)
.then((token: Token) => {
  console.log(token.access_token);
})
.catch((err) => {
  console.log(err);
});
```

`options`:
* `credentialsDir` string
* `grantType` string (`AUTHORIZATION_CODE_GRANT` | `PASSWORD_CREDENTIALS_GRANT` | `REFRESH_TOKEN_GRANT`)
* `accessTokenEndpoint` string
* `scopes` string optional
* `queryParams` {} optional
* `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
* `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)
* `refreshToken` string optional (required with REFRESH_TOKEN_GRANT)

#### AUTHORIZATION_CODE_GRANT

String constant specifying the Authorization Code Grant type.

#### PASSWORD_CREDENTIALS_GRANT

String constant specifying the Resource Owner Password Credentials Grant type.

#### REFRESH_TOKEN_GRANT

String constant specifying the Refresh Token Grant type.

## Mock tooling

If you want to test oAuth locally without being able to actually call real endpoints this library provides some tooling.

#### mockTokenInfoEndpoint(options: MockOptions)

Mocks a `tokeninfo` endpoint.

```typescript
mockTokeninfoEndpoint({
  url: 'http://some.oauth.endpoint/tokeninfo',
  tokens: [{
    access_token: 'someToken123',
    scope: ['uid', 'something.read', 'something.write']
  }],
  times: 1
});
```

`options`:
* `url` string (url of the `tokeninfo` endpoint)
* `tokens` any optional (list of valid tokens)
* `times` number optional (for how many times/calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`)

#### mockAccessTokenEndpoint(options: MockOptions)

Mocks a `access_token` endpoint.

```typescript
mockAccessTokenEndpoint({
  url: 'http://some.oauth.endpoint/access_token',
  times: 1
});
```

`options`:
* `url` string (url of the `access_token` endpoint)
* `times` number optional (for how many times/calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`)

#### cleanMock()

Cleans all `nock` mocks (not only from this lib, really ALL) and given tokens.
Helpful when having multiple tests in a test suite, you can call `cleanMock()` in the `afterEach()` callback for example.

```typescript
cleanMock();
```


## Development

* clone this repo
* `npm install`
* to build: `tsc`
* to lint: `npm run tslint`


## Testing

* `npm test` - runs all tests
* `npm run unit-test` - runs unit tests
* `npm run integration-test` - runs integration tests

## Changelog

---
#### `authmosphere 1.0.0` - **BREAKING**

Modified signature of `createAuthCodeRequestUri`, see migration guide for more information.

---

#### `lib-oauth-tooling 2.0.0` - **BREAKING**

The (zalando-specific) `realm` property was removed from `OAuthConfig`. Also, the corresponding constants (`SERVICES_REALM` and `EMPLYEES_REALM`) were removed. Instead, you can add the realm (and arbitrary other query parameters) via the `queryParams` property in `OAuthConfig`.

#### `lib-oauth-tooling 1.0.0` - **BREAKING**

The signature of `requireScopesMiddleware` is now incompatible with previous versions, `precedenceFunction?` is now part of `precedenceOptions?`.

---

## License

MIT License (MIT)

Copyright (c) 2016 Zalando SE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
