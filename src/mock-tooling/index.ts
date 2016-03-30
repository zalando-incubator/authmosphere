'use strict';

import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as uuid from 'node-uuid';

// TODO: provide cleanup function

let tokens = [];

function generateToken(options: any) {

  return {
    expires_in: 3600,
    scope: options.scopes || [ 'uid' ],
    access_token: uuid.v4()
  };
}

export function mockAccessTokenEndpoint(options) {

  return nock(options.host)
    .post(options.route)
    .query(true)
    .reply((uri, body) => {

      // TODO: extrat scopes from body
      const newToken = generateToken({});
      tokens.push(newToken);

      return [HttpStatus.OK, newToken];
    });
}

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
}
