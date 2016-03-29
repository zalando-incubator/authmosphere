'use strict';

import * as HttpStatus from 'http-status';
import * as nock from 'nock';

let tokens = [];

export function mockAccessTokenEndpoint(options) {

  // register requested tokens in `tokens` to make them available for later
  // validation
  // ...
};

export function mockTokeninfoEndpoint(options) {

  return nock(options.host)
    .persist()
    .get(options.route)
    .query(true)
    .reply((uri) => {

      // token to validate
      const givenToken = uri.split('=')[1];

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

      return [HttpStatus.BAD_REQUEST, { error: 'invalid_request' }];
    });
};
