import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as uuid from 'uuid';
import * as url from 'url';
import * as querystring from 'querystring';

import {
  MockOptions,
  Token
} from '../types';

let _tokens: Token[] = [];

/**
 * Creates a __very basic__ mock of token endpoint as defined in [RFC 6749](https://tools.ietf.org/html/rfc6749).
 *
 * @param options
 * @returns {nock.Scope}
 *
 * @throws on parse error of options.url
 */
const mockAccessTokenEndpoint = (options: MockOptions): nock.Scope => {

  const parsedUrl = parseUrlOrThrow(options);

  return nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
    .post(parsedUrl.path as string) // checked by parseUrlOrThrow
    .times(options.times || Number.MAX_SAFE_INTEGER)
    .query(true)
    .reply((uri: string, requestBody: string) => {

      const body = querystring.parse(requestBody);

      const scope = body.scope ? body.scope.toString().split(' ') : undefined;

      const newToken = generateToken(scope);
      _tokens.push(newToken);

      return [HttpStatus.OK, newToken];
    });
}

/**
 * Creates a __very basic__ mock of a token validation endpoint.
 *
 * @param options
 * @returns {nock.Scope}
 *
 * @throws on parse error of options.url
 */
const mockTokeninfoEndpoint = (options: MockOptions, tokens?: Token[]): nock.Scope => {

  const parsedUrl = parseUrlOrThrow(options);

  return nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
    .get(parsedUrl.path as string) // checked by parseUrlOrThrow
    .times(options.times || Number.MAX_SAFE_INTEGER)
    .query(true)
    .reply((uri: string) => {

      // token to validate
      const givenToken = uri.split('=')[1];

      if (givenToken) {

        // concat all valid tokens (from this function call and potentially from
        // previous calls of `mockAccessTokenEndpoint`)
        const validTokens = (tokens) ? _tokens.concat(tokens) : _tokens;

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

const mockAccessTokenEndpointWithErrorResponse =
  (options: MockOptions, httpStatus: number, responseBody?: object): nock.Scope => {
    return mockEndpointWithErrorResponse(options, httpStatus, responseBody);
  }

const mockTokeninfoEndpointWithErrorResponse =
  (options: MockOptions, httpStatus: number, responseBody?: object): nock.Scope => {
    return mockEndpointWithErrorResponse(options, httpStatus, responseBody);
  }

const mockEndpointWithErrorResponse =
  (options: MockOptions, httpStatus: number, responseBody?: object): nock.Scope => {

    const parsedUrl = parseUrlOrThrow(options);

    return nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
    .post(parsedUrl.path as string) // checked by parseUrlOrThrow
    .times(options.times || Number.MAX_SAFE_INTEGER)
    .query(true)
    .reply(() => {
      return [httpStatus, responseBody || {}];
    });
  }

/**
 * Removes generated tokens and mocked endpoints.
 */
const cleanMock = (): void => {

  nock.cleanAll();
  _tokens = [];
}

const generateToken = (scopes?: string[]): Token => {

  return {
    expires_in: 3600,
    scope: scopes,
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
const parseUrlOrThrow = (options: MockOptions) => {
  const parsedUrl = url.parse(options.url);
  if (typeof parsedUrl !== 'object' ||
    typeof parsedUrl.path !== 'string') {
    throw new Error(`Error parsing '${options.url}'`);
  }
  return parsedUrl;
}

export {
  cleanMock,
  mockAccessTokenEndpoint,
  mockAccessTokenEndpointWithErrorResponse,
  mockTokeninfoEndpoint,
  mockTokeninfoEndpointWithErrorResponse
}
