import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as uuid from 'uuid';
import * as url from 'url';

let tokens = [];

function generateToken() {

  return {
    expires_in: 3600,
    scope: [ 'uid' ],
    access_token: uuid.v4()
  };
}

/**
 * Mocks the access token endpoint (to request a token).
 *
 * @param options
 * @returns {Scope}
 */
export function mockAccessTokenEndpoint(
  options: {
   url: string;
   times?: number;
  }) {

  const parsedUrl = url.parse(options.url);

  nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
    .post(parsedUrl.path)
    .times(options.times || Number.MAX_SAFE_INTEGER)
    .query(true)
    .reply((uri, body) => {

      // TODO: in the future we want to extrat scopes from body
      const newToken = generateToken();
      tokens.push(newToken);

      return [HttpStatus.OK, newToken];
    });
}

/**
 * Mocks the tokeninfo endpoint (to validate a token).
 *
 * @param options
 * @returns {Scope}
 */
export function mockTokeninfoEndpoint(
  options: {
    url: string;
    tokens?: any[];
    times?: number;
  }) {

  const parsedUrl = url.parse(options.url);

  nock(`${parsedUrl.protocol}//${parsedUrl.host}`)
    .get(parsedUrl.path)
    .times(options.times || Number.MAX_SAFE_INTEGER)
    .query(true)
    .reply((uri, body) => {

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
export function cleanMock() {

  nock.cleanAll();
  tokens = [];
}
