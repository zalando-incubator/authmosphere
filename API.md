# Authmosphere API Documentation

## OAuth Tooling

This tooling provides helper functions to request and validate tokens based on the OAuth 2.0 [RFC 6749](https://tools.ietf.org/html/rfc6749) specification.

### getAccessToken

Requests a token based on the given configuration (which specifies the grant type and corresponding parameters). See the [`OAuthConfig` documentation](#tbd) for details.

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
  accessTokenEndpoint: 'example.com/token',
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

`getAccessToken(config[, logger]): Promise<Token>`

#### Arguments

* [`config: OAuthConfig`](#tbd) - OAuth configuration for the request (specify grant type and corresponding parameters)
* [`logger?: Logger`](#tbd) - Optional logger

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

getTokenInfo('example.com/tokeninfo', '1234-5678-9000')
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
* `accessToken: string` - Token to be validated
* [`logger?: Logger`](#tbd) - Optional logger

#### Returns

`Promise<Token>` which resolves with the validated token if it is valid. Otherwise, rejects with an error message.

### createAuthCodeRequestUri

Helper function to create the URI to request an authorization code when using the [Authorization Code Grant](https://tools.ietf.org/html/rfc6749#page-24).

⚠️ This function only creates the URI, it does not handle the actual request.

#### Usage

```ts
const uri = createAuthCodeRequestUri('example.com/authorize', 'http://your-app.com/handle-auth-code', '1234-client-id');
```

#### Signature

`createAuthCodeRequestUri(authorizationEndpoint, redirectUri, clientId[, queryParams]): string`

#### Arguments

* `authorizationEndpoint: string` - [OAuth authorization endpoint](https://tools.ietf.org/html/rfc6749#page-18)
* `redirectUri: string` - absolute URI specifying the endpoint the authorization code is responded to (see [OAuth 2.0 specification](https://tools.ietf.org/html/rfc6749#section-3.1.2) for details)
* `clientId: string` - [client id]((https://tools.ietf.org/html/rfc6749#section-2.2)) of the requesting application
* `queryParams?: { [index: string]: string }` - optional set of key-value pairs which will be added as query parameters to the request (for example to add [`state` or `scopes`](https://tools.ietf.org/html/rfc6749#section-4.1.1))

#### Returns

`string` of the created request URI.

----

## Express Tooling

Authmosphere provides two middleware factories to secure Express based http services.

### authenticationMiddleware

Middleware that handles OAuth authentication for API endpoints. It extracts and validates the `access token` from the request.

If configured as a global middleware(see usage section), all request need to provide a valid token to access the endpoint.
<br>
If some endpoints should be excluded from this restriction, they need to be added to the `options.publicEndpoints` array to be whitelisted.

If validation of the provided token fails the middleware rejects the request with status _401 UNAUTHORIZED_. <br>
To overwrite this behavior a custom handler can be specified by passing in `options.onNotAuthenticatedHandler` (see [`onNotAuthenticatedHandler`](./src/types/AuthenticationMiddlewareOptions.ts)).

* ⚠️&nbsp;&nbsp;While this middleware could also be configured per endpoint (i.e. `app.get(authenticationMiddleware(...), endpoint)` it is not recommended as using it as global middleware will force you into a whitelist setup.
  * Make sure `authenticationMiddleware` is at the top of the registered request handlers. This is essential to gurantee the enforceability of the whitelist strategy.
* ⚠️&nbsp;&nbsp;The middleware attaches metadata (scopes of the token) to the express request object. The `requireScopesMiddleware` relies on this information.


#### Usage

```typescript
import {
  authenticationMiddleware
} from 'authmosphere';

app.use(authenticationMiddleware({
  publicEndpoints: ['/heartbeat', '/status'],
  tokenInfoEndpoint: 'auth.example.com/tokeninfo'
});
```

#### Signature

`authenticationMiddleware(options) => express.RequestHandler`

#### Arguments

* [`options`](./src/types/AuthenticationMiddlewareOptions.ts):
  * `tokenInfoEndpoint: string` - url of the Token validation endpoint
  * `publicEndpoints?: string[] - list of whitelisted API paths`
  * `logger?: Logger` - [logger](./src/types/Logger.ts)
  * [`onNotAuthenticatedHandler?: onNotAuthenticatedHandler`](./src/types/AuthenticationMiddlewareOptions.ts) - custom response handler

### requireScopesMiddleware

Specifies the scopes needed to access an endpoint. Assumes that there is an `request.scopes` property (as attached by `handleOAuthRequestMiddleware`) to match the required scopes against.
If the the requested scopes are not matched request is rejected (with 403 Forbidden).

```typescript
app.get('/secured/route', requireScopesMiddleware(['scopeA', 'scopeB']), (request, response) => {
  // do your work...
})
```

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
  url: 'http://some.oauth.endpoint/access_token',
  times: 1
});
```

#### Signature

`mockAccessTokenEndpoint(options) => nock.Scope`

#### Arguments

* [`options`](./src/types/MockOptions.ts):
  * `url: string` - url of the Token validation endpoint
  * `times?: number` - defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`

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
    url: 'http://some.oauth.endpoint/tokeninfo',
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
  * `url: string` - url of the Token validation endpoint
  * `times?: number` - defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`
* `tokens: Token[]` -  optional list of valid tokens and their scopes.

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
  url: 'http://some.oauth.endpoint/access_token',
  times: 1
}, 401, {status: 'foo'});
```

#### Signature
`mockAccessTokenEndpointWithErrorResponse(options, httpStatus, responseBody) => nock.Scope`

#### Arguments

* [`options`](./src/types/MockOptions.ts):
  * `url: string` - url of the Token validation endpoint
  * `times?: number` - defines number of calls the endpoint is mocked, default is `Number.MAX_SAFE_INTEGER`
* `httpStatus: number` - statusCode of the response
* `responseBody?: object`- body of the response

----
