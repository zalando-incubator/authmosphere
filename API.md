# Authmosphere API documentation

## Mock tooling

This tooling provides an abstraction to easily mock OAuth 2.0 [RFC 6749](https://tools.ietf.org/html/rfc6749) related endpoints.

It helps to easily write integration tests without writing extensive boilerplate code and without disabling OAuth for tests.

This tooling is based on Nock, a HTTP mocking library. For more information about Nock see [Nock documentation](https://github.com/node-nock/nock).

### mockAccessTokenEndpoint

Creates a __very basic__ mock of token endpoint as defined in [RFC 6749](https://tools.ietf.org/html/rfc6749).

The mocked endpoint will return a [token](./src/types/Token.ts) with the scopes specified in the request.

* ⚠️ The mock does not validate the request
* ⚠️ The mock holds a state that contains the created tokens
* ⚠️ `cleanMock` resets the state and removes all nocks

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
