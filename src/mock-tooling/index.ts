import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as uuid from 'uuid';
import * as url from 'url';

import {
  MockOptions,
  Token
} from '../types';

let tokens: Token[] = [];

function generateToken(): Token {

  return {
    expires_in: 3600,
    scope: [ 'uid' ],
    access_token: uuid.v4()
  };
}

/**
 * Parses URL and throws, if URL is neither string nor object
 *
 * @param options
 *
 * @throws on parse error of options.url
 */
function parseUrlOrThrow(options: MockOptions) {
  const parsedUrl = url.parse(options.url);
  if (typeof parsedUrl !== 'object' ||
    typeof parsedUrl.path !== 'string') {
    throw new Error(`Error parsing '${options.url}'`);
  }
  return parsedUrl;
}

/**
 * Mocks the access token endpoint (to request a token).
 *
 * @param options
 * @returns {Scope}
 *
 * @throws on parse error of options.url
 */
export function mockAccessTokenEndpoint(options: MockOptions): void {

  const parsedUrl = parseUrlOrThrow(options);

  nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
  .post(parsedUrl.path as string) // checked by parseUrlOrThrow
  .times(options.times || Number.MAX_SAFE_INTEGER)
  .query(true)
  .reply(() => {

    // TODO: in the future we want to extract scopes from body
    const newToken = generateToken();
    tokens.push(newToken);

    return [HttpStatus.OK, newToken];
  });
}

export function mockAccessTokenEndpointWithErrorResponse(options: MockOptions, httpStatus: HttpStatus | number, responseBody?: object): void {
  mockEndpointWithErrorResponse(options, httpStatus, responseBody);
}

export function mockTokeninfoEndpointWithErrorResponse(options: MockOptions, httpStatus: HttpStatus | number, responseBody?: object): void {
  mockEndpointWithErrorResponse(options, httpStatus, responseBody);
}

function mockEndpointWithErrorResponse(options: MockOptions, httpStatus: HttpStatus | number, responseBody?: object): void {

  const parsedUrl = parseUrlOrThrow(options);

  nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
  .post(parsedUrl.path as string) // checked by parseUrlOrThrow
  .times(options.times || Number.MAX_SAFE_INTEGER)
  .query(true)
  .reply(() => {
    return [httpStatus, responseBody];
  });
}

/**
 * Mocks the tokeninfo endpoint (to validate a token).
 *
 * @param options
 * @returns {Scope}
 *
 * @throws on parse error of options.url
 */
export function mockTokeninfoEndpoint(options: MockOptions): void {

  const parsedUrl = parseUrlOrThrow(options);

  nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
  .get(parsedUrl.path as string) // checked by parseUrlOrThrow
  .times(options.times || Number.MAX_SAFE_INTEGER)
  .query(true)
  .reply((uri: string) => {

    // token to validate
    const givenToken = uri.split('=')[1];

    if (givenToken) {

      // concat all valid tokens (from this function call and potentially from
      // previous calls of `mockAccessTokenEndpoint`)
      const validTokens = (options.tokens) ? tokens.concat(options.tokens) : tokens;

      // find token
      const foundIndex = validTokens.findIndex((token) => {

        return givenToken === token.access_token;
      });

      if (foundIndex >= 0) {
        return [HttpStatus.OK, validTokens[foundIndex]];
      }
    }

    return [HttpStatus.BAD_REQUEST, { error: 'invalid_request' }];
  });
}

/**
 * Removes generated tokens and mocked endpoints.
 */
export function cleanMock(): void {

  nock.cleanAll();
  tokens = [];
}
