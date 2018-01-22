# authmosphere {🌍}

[![Build Status](https://travis-ci.org/zalando-incubator/authmosphere.svg)](https://travis-ci.org/zalando-incubator/authmosphere?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/zalando-incubator/authmosphere/badge.svg?branch=master)](https://coveralls.io/github/zalando-incubator/authmosphere)
[![npm download](https://img.shields.io/npm/dm/authmosphere.svg?style=flat-square)](https://www.npmjs.com/package/authmosphere)
[![npm version](https://img.shields.io/npm/v/authmosphere.svg?style=flat)](https://www.npmjs.com/package/authmosphere)

## Introduction

`{authmosphere}` is a library to support OAuth2 workflows in JavaScript projects.

It's implemented in TypeScript which improves the development experience via implicit documentation with types, first-class IDE support and provides mock tooling for local development. The library itself is transpiled to JavaScript (ES6) so there is no need for a TypeScript compiler to use authmosphere in JavaScript projects.

Currently the following flows are supported:

* [Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)
* [Client Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.4)
* [Resource Owner Password Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.3)
* [Refresh Token Grant](https://tools.ietf.org/html/rfc6749#section-6)
* Express middlewares to simplify authentication/authorization
* `TokenCache` service to manage access tokens in your application
* Mock tooling for OAuth2.0 endpoints to enable decent unit and integration tests

See [STUPS documentation](http://stups.readthedocs.org/en/latest/user-guide/access-control.html#implementing-a-client-asking-resource-owners-for-permission) and [OAuth2 documentation](https://tools.ietf.org/html/rfc6749) for more information.

## Changelog and Migration

* See the [changelog](./CHANGELOG.md) for more information.
* See the [migration guide](./MIGRATION_GUIDE.md) for more information.

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

#### TokenCache(tokenConfig: { [key: string]: string[] }, oAuthConfig: OAuthConfig, tokenCacheConfig?: TokenCacheConfig)

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

The `OAuthConfig` type is defined as union type:

```typescript
type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;
```

As you can see there are four different config types defined, which can be used in any places where `OAuthConfig` is required:

* ClientCredentialsGrantConfig
* AuthorizationCodeGrantConfig
* PasswordCredentialsGrantConfig
* RefreshGrantConfig

Each config type has common properties:

```typescript
type GrantConfigBase = {
  credentialsDir: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
};
```

The constant grant types literals can be found in `OAuthGrandType`

Optionally, you can pass a third parameter of type `TokenCacheConfig` to the `TokenCache` constructor to configure the cache behaviour.

```typescript
const tokenCache = new TokenCache({
  'service-foo': ['foo.read', 'foo.write'],
  'service-bar': ['bar.read']
}, oAuthConfig, cacheConfig);
```

Where`TokenCacheConfig` is defined like:

```typescript
type TokenCacheConfig = {
  /**
   * To determine when a token is expired locally (means
   * when to issue a new token): if the token exists for
   * ((1 - percentageLeft) * lifetime) then issue a new one.
   * Default value: 0.75
   */
  percentageLeft: number
};
```

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

Type `Token` is defined as following:

```typescript
type Token<CustomTokenPart = any> = CustomTokenPart & {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
};
```

The `Token` type is designed to be extensible. By default the generic type parameter `CustomTokenPart` defaults to `any`. One can provide an additional type to extend the known properties for the Token type:

```typescript

  type CustomDataType = {
    uid: "user",
    ...
  };

  const myCustomToken: Token<CustomDataType> = {
   ...
  };
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

#### AUTHORIZATION_CODE_GRANT

String constant specifying the Authorization Code Grant type.

#### PASSWORD_CREDENTIALS_GRANT

String constant specifying the Resource Owner Password Credentials Grant type.

#### REFRESH_TOKEN_GRANT

String constant specifying the Refresh Token Grant type.

## Mock tooling

If you want to test oAuth locally without being able to actually call real endpoints this library provides some tooling.

### mockTokenInfoEndpoint(options: MockOptions)

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

### mockAccessTokenEndpoint(options: MockOptions)

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
* to build: `npm run build`
* to lint: `npm run tslint`

## Testing

* `npm test` - runs all tests
* `npm run unit-test` - runs unit tests
* `npm run integration-test` - runs integration tests

---

## License

MIT License (MIT)

Copyright (c) 2016 Zalando SE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
