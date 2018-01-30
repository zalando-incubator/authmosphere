# Authmosphere API Documentation

## TOC

1. [TokenCache](#token-cache)
2. [OAuth tooling](#oauth-tooling)
    * [getAccessToken](#getaccesstoken)
    * [getTokenInfo](#gettokeninfo)
3. [Express middlewares](#express-tooling)
    * [authenticationMiddleware](#authenticationMiddleware)
    * [requireScopesMiddleware](#requireScopesMiddleware)
4. [Types](#types)
    * [OAuthConfig](#oauthconfig)
    * [ClientCredentialsGrantConfig](#clientcredentialsgrantconfig)
    * [AuthorizationCodeGrantConfig](#clientcredentialsgrantconfig)
    * [PasswordCredentialsGrantConfig](#clientcredentialsgrantconfig)
    * [RefreshGrantConfig](#refreshgrantconfig)
    * [Token](#token)
5. [Mock tooling](#mock-tooling)
    * [mockAccessTokenEndpoint](#mockaccesstokenendpoint)
    * [mockTokenInfoEndpoint](#mocktokeninfoendpoint)
    * [cleanMock](#cleanmock)

## Token Cache

Class to request and cache tokens on client-side.

#### Usage

```typescript
import {
  TokenCache,
  OAuthGrantType,
  Token
} from 'authmosphere';

const options = {
  cacheConfig: {
    percentageLeft: 0.75
  },
  logger: someExternalLogger
};

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
const tokenCache = new TokenCache(tokenConfig, oAuthConfig, options);

// request and resolve a token from the cache
tokenCache
  .get('service-foo') // needs to match with a key from 'tokenConfig'
  .then((token: Token) => {
    // ...use the token...
  });
```

### constructor

<details>
<summary>Hide / Show details</summary>

#### Signature

```ts
constructor(tokenConfig, oauthConfig, options)
```

#### Arguments

* `tokenConfig: [key: string]: string[]` - Mapping between a name (representing a token) and the scopes requested for the corresponding token.
* `oauthConfig: TokenCacheOAuthConfig` -
  Either [`ClientCredentialsGrantConfig`](#clientcredentialsgrantconfig) or [`PasswordCredentialsGrantConfig`](#passwordcredentialsgrantconfig) plus the additional `tokenInfoEndpoint: string` property that specifies the URL of the token validation endpoint.
* [`options?: TokenCacheOptions`](./src/types/TokenCacheConfig.ts)
  * [`cacheConfig?: CacheConfig`](./src/types/TokenCacheConfig.ts)
    * `percentageLeft: number` - To determine when a token is expired locally (means when to issue a new token): if the token exists for `((1 - percentageLeft) * lifetime)` then issue a new one.
  * [`logger?: Logger`](#logging)

</details>

### get

<details>
<summary>Hide / Show details</summary>

Returns cached token or requests a new one if lifetime (as configured in `cacheOptions.cacheConfig`) is expired.

#### Signature

```ts
get(tokenName) => Promise<Token>
```

#### Arguments

* `tokenName: string` - Key of the token as configured in `tokenConfig`

#### Returns

[`Promise<Token>`](./src/types/Token.ts) that resolves with a token with configured scopes. In case of error rejects with an error message.

</details>

### refreshToken

Triggers the request of a new token. Invalidates the old cache entry.

#### Signature

```ts
refreshToken(tokenName: string) => Promise<Token>
```

#### Arguments

* `tokenName: string` - Key of the token as configured in `tokenConfig`

#### Returns

`Promise<Token>` that resolves with a token with configured scopes. In case of error rejects with an error message.

### refreshAllTokens

Triggers the request of a new token for all configured ones. Invalidates all cache entries.

#### Signature

```ts
refreshAllTokens() => Promise<TokenMap>
```

#### Returns

`Promise<TokenMap>` that resolves with a map of tokens with configured scopes. In case of error rejects with an error message.

---

## OAuth Tooling

This tooling provides helper functions to request and validate tokens based on the OAuth 2.0 [RFC 6749](https://tools.ietf.org/html/rfc6749) specification.

### getAccessToken

Requests a token based on the given configuration (which specifies the grant type and corresponding parameters). See the [`OAuthConfig` documentation](#types) for details.

#### Usage

```ts
import {
  OAuthGrantType,
  ClientCredentialsGrantConfig,
  Token,
  getAccessToken
} from 'authmosphere';

const config: ClientCredentialsGrantConfig = {
  grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
  credentialsDir: './crendentials',
  accessTokenEndpoint: 'https://example.com/token_validation',
  scopes: ['my-app.read', 'my-app.write'];
};

getAccessToken(config)
  .then((token: Token) => {
    // ...use the token...
  })
  .catch((err) => {
    // ...handle the error...
  });
```

#### Signature

`getAccessToken(config[, logger]) => Promise<Token>`

#### Arguments

* [`config: OAuthConfig`](#types) - OAuth configuration for the request (specify grant type and corresponding parameters)
* [`logger?: Logger`](#logging)

#### Returns

`Promise<Token>` which resolves with the token if the request was successful. Otherwise, rejects with an error message.

### getTokenInfo

Requests validation information from the specified `tokenInfoUrl` and returns a `Promise` that resolves with these information, if the token is valid. Otherwise, it rejects with an error.

#### Usage

```ts
import {
  Token,
  getTokenInfo
} from 'authmosphere';

getTokenInfo('https://example.com/token_validation', '1234-5678-9000')
  .then((token: Token) => {
    // ...token is valid...
  })
  .catch((err) => {
    // ...token is invalid...
  })
```

#### Signature

`getTokenInfo<T>(tokenInfoUrl, accessToken[, logger]): Promise<Token<T>>`

#### Arguments

* `tokenInfoUrl: string` - OAuth endpoint for validating tokens
* `accessToken: string` - access token to be validated
* [`logger?: Logger`](#logging)

#### Returns

`Promise<Token>` which resolves with the validated token if it is valid. Otherwise, rejects with an error message.

### createAuthCodeRequestUri

Helper function to create the URI to request an authorization code when using the [Authorization Code Grant](https://tools.ietf.org/html/rfc6749#page-24).

⚠️ This function only creates the URI, it does not handle the actual request.

#### Usage

```ts
const uri = createAuthCodeRequestUri('https://example.com/authorize', 'http://your-app.com/handle-auth-code', '1234-client-id');
```

#### Signature

`createAuthCodeRequestUri(authorizationEndpoint, redirectUri, clientId[, queryParams]) => string`

#### Arguments

* `authorizationEndpoint: string` - [OAuth authorization endpoint](https://tools.ietf.org/html/rfc6749#page-18)
* `redirectUri: string` - Absolute URI specifying the endpoint the authorization code is responded to (see [OAuth 2.0 specification](https://tools.ietf.org/html/rfc6749#section-3.1.2) for details)
* `clientId: string` - [client id]((https://tools.ietf.org/html/rfc6749#section-2.2)) of the requesting application
* `queryParams?: { [index: string]: string }` - Set of key-value pairs which will be added as query parameters to the request (for example to add [`state` or `scopes`](https://tools.ietf.org/html/rfc6749#section-4.1.1))

#### Returns

`string` of the created request URI.

----

## Express Tooling

Authmosphere provides two middleware factories to secure [Express](http://expressjs.com/) based http services.

### authenticationMiddleware

Middleware that handles OAuth authentication for API endpoints. It extracts and validates the `access token` from the request.

If configured as a global middleware (see usage section), all requests need to provide a valid token to access the endpoint.
<br>
If some endpoints should be excluded from this restriction, they need to be added to the `options.publicEndpoints` array to be whitelisted.

If validation of the provided token fails the middleware rejects the request with status _401 UNAUTHORIZED_. <br>
To overwrite this behavior a custom handler can be specified by passing in `options.onNotAuthenticatedHandler` (see [`onNotAuthenticatedHandler`](./src/types/AuthenticationMiddlewareOptions.ts)).

* ⚠️&nbsp;&nbsp;While this middleware could also be configured per endpoint (i.e. `app.get(authenticationMiddleware(...), endpoint)` it is not recommended as using it as global middleware will force you into a whitelist setup.
  * Make sure `authenticationMiddleware` is at the top of the registered request handlers. This is essential to guarantee the enforceability of the whitelist strategy.
* ⚠️&nbsp;&nbsp;The middleware attaches metadata (scopes of the token) to the express request object. The `requireScopesMiddleware` relies on this information.


#### Usage

```typescript
import {
  authenticationMiddleware
} from 'authmosphere';

app.use(authenticationMiddleware({
  publicEndpoints: ['/heartbeat', '/status'],
  tokenInfoEndpoint: 'https://example.com/token_validation'
});
```

#### Signature

`authenticationMiddleware(options) => express.RequestHandler`

#### Arguments

* [`options`](./src/types/AuthenticationMiddlewareOptions.ts):
  * `tokenInfoEndpoint: string` - URL of the Token validation endpoint
  * `publicEndpoints?: string[] - List of whitelisted API paths`
  * [`logger?: Logger`](./src/types/Logger.ts)
  * [`onNotAuthenticatedHandler?: onNotAuthenticatedHandler`](./src/types/AuthenticationMiddlewareOptions.ts) - custom response handler

### requireScopesMiddleware

A factory that returns a middleware that compares scopes attached to `express.Request` object with a given list (`scopes` parameter). If all required scopes are matched, the middleware calls `next`. Otherwise, it rejects the request with _403 FORBIDDEN_.

* ⚠️&nbsp;&nbsp;This middleware requires scope information to be attached to the `Express.request` object. The `authenticationMiddleware` can do this job. Otherwise `request.$$tokeninfo.scope: string[]` has to be set manually.

There may occur cases where another type of authorization should be used. For that cases `options.precedenceFunction` has to be set. If the `precedence` function resolves with anything else than 'true', normal scope validation is applied afterwards.

Detailed middleware authorization flow:

```
+-----------------------------------+
|   is precedenceFunction defined?  |
+-----------------------------------+
        |             |
        |             | yes
        |             v
        |    +----------------------+  resolve(true)  +--------+       +---------------+
     no |    | precedenceFunction() |---------------->| next() | ----->| call endpoint |
        |    +----------------------+                 +--------+       +---------------+
        |             |
        |             | reject
        v             v
+-----------------------------------+        yes      +--------+       +---------------+
| scopes match with requiredScopes? |---------------->| next() |------>| call endpoint |
+-----------------------------------+                 +--------+       +---------------+
        |
    no/ |
  throw v
+----------------------------------+         yes      +--------------------------------+
| is onAuthorizationFailedHandler  |----------------->| onAuthorizationFailedHandler() |
| configured?                      |                  +--------------------------------+
+----------------------------------+
        |
        |               no                            +--------------------------------+
        +-------------------------------------------->|    response.sendStatus(403)    |
                                                      +--------------------------------+
```

#### Usage

```typescript
import {
  requireScopesMiddleware
} from 'authmosphere';

app.get('/secured/route', requireScopesMiddleware(['scopeA', 'scopeB']), (request, response) => {
  // handle request
});
```

#### Signature

`(scopes: string[], options?: ScopeMiddlewareOptions) => express.RequestHandler`

#### Arguments

* `scopes: string`
* [`options`](./src/types/ScopeMiddlewareOptions.ts) -
  * [`logger?: Logger`](./src/types/Logger.ts)
  * [onAuthorizationFailedHandler?: onAuthorizationFailedHandler](./src/types/AuthenticationMiddlewareOptions.ts) - Custom handler for failed authorizations
  * [`precedenceOptions?: precedenceOptions`](./src/types/PrecedenceFunction) - Function


---

## Logging

Logging is an essential part of Authmosphere's tooling. Authmosphere does not rely on `console` or any other specific logger library, instead every function expects a (optional) reference to an external logger. The logger must fulfill this interface:

```ts
interface Logger {
  info(message: string, error?: any): void;
  debug(message: string, error?: any): void;
  error(message: string, error?: any): void;
  fatal(message: string, error?: any): void;
  trace(message: string, error?: any): void;
  warn(message: string, error?: any): void;
}
```

---

## Types

### OAuthConfig

```ts
type OAuthConfig =
  ClientCredentialsGrantConfig   |
  AuthorizationCodeGrantConfig   |
  PasswordCredentialsGrantConfig |
  RefreshGrantConfig;
```

### [ClientCredentialsGrantConfig](https://tools.ietf.org/html/rfc6749#section-4.4)

```ts
type ClientCredentialsGrantConfig = {
  grantType: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
  credentialsDir: string;
}
```

### [AuthorizationCodeGrantConfig](https://tools.ietf.org/html/rfc6749#section-4.1)

```ts
type AuthorizationCodeGrantConfig = {
  grantType: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
  credentialsDir: string;
  code: string;
  redirectUri: string;
}
```

### [PasswordCredentialsGrantConfig](https://tools.ietf.org/html/rfc6749#section-4.3)

```ts
type PasswordCredentialsGrantConfig = {
  grantType: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
  credentialsDir: string;
}
```

### [RefreshGrantConfig](https://tools.ietf.org/html/rfc6749#section-1.5)

```ts
type RefreshGrantConfig = {
  grantType: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
  credentialsDir: string;
  refreshToken: string;
}
```

### Passing credentials explicitly

Instead of providing a credentials directory (`credentialsDir`) client and user credentials can be passed explicitly.

```ts
type ClientCredentialsGrantConfig = {
  grantType: string;
  accessTokenEndpoint: string;
  queryParams?: { [index: string]: string };
  bodyParams?: { [index: string]: string };
  scopes?: string[];
  clientId: string,
  clientSecret: string
}
```

Client credentials can be passed in via `clientId` and `clientSecrect`, user credentials via `applicationUsername` and `applicationPassword`;

### Token

```ts
type Token<CustomTokenPart = {}> = CustomTokenPart & {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
};
```

Token type it can be extend to satisfy special needs:

```ts
const mytoken: Token<{ id: number }> = {
  access_token: 'abcToken',
  id: 2424242828
}
```

---

## Mock Tooling

This tooling provides an abstraction to easily mock OAuth 2.0 [RFC 6749](https://tools.ietf.org/html/rfc6749) related endpoints.

It helps to easily write integration tests without writing extensive boilerplate code and without disabling OAuth for tests.

This tooling is based on Nock, a HTTP mocking library. For more information about Nock see [Nock documentation](https://github.com/node-nock/nock).

### mockAccessTokenEndpoint

Creates a *very basic* mock of token endpoint as defined in [RFC 6749](https://tools.ietf.org/html/rfc6749).

The mocked endpoint will return a [token](./src/types/Token.ts) with the scopes specified in the request.

* ⚠️&nbsp;&nbsp;The mock does not validate the request
* ⚠️&nbsp;&nbsp;The mock holds a state that contains the created tokens
* ⚠️&nbsp;&nbsp;`cleanMock` resets the state and removes __all__ nocks

#### Usage

```typescript
mockAccessTokenEndpoint({
  url: 'https://example.com/access_token',
  times: 1
});
```

#### Signature

`mockAccessTokenEndpoint(options) => nock.Scope`

#### Arguments

* [`options`](./src/types/MockOptions.ts):
  * `url: string` - URL of the Token validation endpoint
  * `times?: number` - Defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`

### mockTokenInfoEndpoint

Creates a __very basic__ mock of a token validation endpoint.

Returns `200` and a Token object if the given token is valid (via query parameter).
The token is valid:

* If it is specified via options parameter
* If it was created by `mockAccessTokenEndpoint`

Return `400` if the given Token is invalid.

The optional `tokens` property in `MockOptions` can be used to restrict the list of valid access_tokens.

#### Usage

```typescript
mockTokeninfoEndpoint(
  {
    url: 'https://example.com//token_validation',
    times: 1
  },
  tokens: [
    {
      access_token: 'someToken123',
      scope: ['uid', 'something.read', 'something.write']
    }
  ]
);
```

#### Signature

`mockTokeninfoEndpoint(options, tokens) => nock.Scope`

#### Arguments

* [`options`](./src/types/MockOptions.ts):
  * `url: string` - URL of the Token validation endpoint
  * `times?: number` - Defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`
* `tokens?: Token[]` - List of valid tokens and their scopes.

### cleanMock()

* Remove all `nock` mocks (not only from this lib, really __ALL__)
* Resets the tocken state object used by `mockTokeninfoEndpoint` and `mockAccessTokenEndpoint`
and given tokens.

Hint:
Helpful when having multiple tests in a test suite, you can call `cleanMock()` in the `afterEach()` callback for example.

#### Usage

```typescript
cleanMock();
```

### Mock error endpoints

Two mock failing OAuth Endpoints use this mocks:

* `mockAccessTokenEndpointWithErrorResponse`
* `mockTokeninfoEndpointWithErrorResponse`

#### Usage

```typescript
mockAccessTokenEndpointWithErrorResponse({
  url: 'https://example.com/access_token',
  times: 1
}, 401, { status: 'foo' });
```

#### Signature
`mockAccessTokenEndpointWithErrorResponse(options, httpStatus, responseBody) => nock.Scope`

#### Arguments

* [`options`](./src/types/MockOptions.ts):
  * `url: string` - URL of the Token validation endpoint
  * `times?: number` - Defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`
* `httpStatus: number` - StatusCode of the response
* `responseBody?: object`- Body of the response

----
