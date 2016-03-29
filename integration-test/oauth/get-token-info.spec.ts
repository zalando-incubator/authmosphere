'use strict';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as nock from 'nock';

import { getTokenInfo } from '../../src/index';
import { mockTokeninfoEndpoint } from '../../src/mock-tooling/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

const host = 'http://localhost:5001';
const route = '/tokeninfo';
const endpoint = host + route;

describe('Integration tests for getTokenInfo', () => {

  afterEach(() => {

    nock.cleanAll();
  });

  it('should return error if token is not valid', () => {

    // given
    mockTokeninfoEndpoint({
      host,
      route
    });

    // when
    let promise = getTokenInfo(endpoint, 'invalid');

    // then
    return expect(promise).to.rejected;
  });


  it('should return the token info if token is valid', function() {

    // given
    const validAuthToken = {
      'expires_in': 3600,
      'realm': 'services',
      'scope': [ 'uid' ],
      'access_token': 'foo'
    };
    mockTokeninfoEndpoint({
      host,
      route,
      tokens: [validAuthToken]
    });

    // when
    let promise = getTokenInfo(endpoint, 'foo');

    // then
    return expect(promise).to.become(validAuthToken);
  });
});
