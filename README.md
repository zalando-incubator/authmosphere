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

Currently the [Authmosphere JavaScript API](./API.md) supports:

* [Express middlewares](./API.md#express-tooling) to simplify authentication/authorization
* [`TokenCache`](./API.md#token-cache) service to manage access tokens in your application
* OAuth tooling
  * [`getAccessToken`](./API.md#getaccesstoken) - helper to request access tokens
  * [`getTokenInfo`](./API.md#gettokeninfo) - help to validate access tokens
* [Mock tooling](./API.md#mock-tooling) for OAuth2.0 endpoints to enable decent unit and integration tests

See [STUPS documentation](http://stups.readthedocs.org/en/latest/user-guide/access-control.html#implementing-a-client-asking-resource-owners-for-permission) and [OAuth2 documentation](https://tools.ietf.org/html/rfc6749) for more information.



## Setup

* `node >= 6.0.0` required to consume this library
* `npm install authmosphere`

Importing from this library works like this:

```typescript
import {
  TokenCache,
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  ...
} from 'authmosphere';
```

[API](./API.md)

## Changelog and Migration

* See the [changelog](./CHANGELOG.md) for more information.
* See the [migration guide](./MIGRATION_GUIDE.md) for more information.

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
