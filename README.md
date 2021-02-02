# authmosphere {🌍}

[![Build Status](https://travis-ci.org/zalando-incubator/authmosphere.svg)](https://travis-ci.org/zalando-incubator/authmosphere?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/zalando-incubator/authmosphere/badge.svg?branch=master)](https://coveralls.io/github/zalando-incubator/authmosphere)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4047d64636ff40a38208b6b84d186ebd)](https://www.codacy.com/app/Retro64/authmosphere?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=zalando-incubator/authmosphere&amp;utm_campaign=Badge_Grade)
[![npm download](https://img.shields.io/npm/dm/authmosphere.svg?style=flat-square)](https://www.npmjs.com/package/authmosphere)
[![npm version](https://img.shields.io/npm/v/authmosphere.svg?style=flat)](https://www.npmjs.com/package/authmosphere)

## Introduction

`{authmosphere}` is a library to support and test [OAuth 2.0](https://tools.ietf.org/html/rfc6749) workflows in JavaScript projects.

It's implemented in TypeScript which improves the development experience via implicit documentation with types and first-class IDE support. The library itself is transpiled to JavaScript (ES6) so there is no need for a TypeScript compiler to use authmosphere in JavaScript projects.

The following OAuth flows are supported:

* [Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)
* [Client Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.4)
* [Resource Owner Password Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.3)
* [Refresh Token Grant](https://tools.ietf.org/html/rfc6749#section-6)

The [Authmosphere JavaScript API](./API.md) supports:

* [Express middlewares](./API.md#express-tooling) to simplify authentication and authorization
* [`TokenCache`](./API.md#token-cache) service to manage access tokens
* [OAuth tooling](./API.md#oauth-tooling)
  * [`getAccessToken`](./API.md#getaccesstoken) - helper to request access tokens
  * [`getTokenInfo`](./API.md#gettokeninfo) - helper to validate access tokens
* [Mock tooling](./API.md#mock-tooling) for OAuth 2.0 endpoints to enable decent unit and integration tests

## Usage

For a comprehensive documentation checkout out the [API documentation](./API.md).

### Request and cache tokens

```typescript
import { TokenCache, OAuthGrantType } from 'authmosphere';

const oAuthConfig = {
  grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
  accessTokenEndpoint: 'https://example.com/access_token',
  credentialsDir: './credentialsDir'
};

const tokenConfig = {
  'service-foo': ['foo.read', 'foo.write'],
  'service-bar': ['bar.read']
};

// create a new TokenCache instance
const tokenCache = new TokenCache(tokenConfig, oAuthConfig);

// request and resolve a token from the cache
tokenCache
  .get('service-foo') // needs to match with a key from 'tokenConfig'
  .then((token) => { /* ...use the token... */ });
```

### Secure express endpoints

```typescript
import { authenticationMiddleware, requireScopesMiddleware } from 'authmosphere';

// extract and validate access token (authorization header)
// and reject requests without valid access token
app.use(authenticationMiddleware({ tokenInfoEndpoint: 'https://example.com/token_validation' });

// only allow access for requests with tokens that have scopeA and scopeB
app.get('/secured/route', requireScopesMiddleware(['scopeA', 'scopeB']), (request, response) => {
  // handle request
});
```

## Setup

* `node >= 6.0.0` required to consume this library
* `npm install authmosphere`

## OAuth documentation

* See [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749) for more information.

## Changelog and Migration

* See the [changelog](./CHANGELOG.md) for more information.
* See the [migration guide](./MIGRATION_GUIDE.md) for more information.

## Development

* clone this repo
* `npm install`
* to build: `npm run build`
* to lint: `npm run lint`

## Testing

* `npm test` - runs all tests
* `npm run unit-test` - runs unit tests
* `npm run integration-test` - runs integration tests

---

## License

MIT License (MIT)

Copyright (c) 2021 Zalando SE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
