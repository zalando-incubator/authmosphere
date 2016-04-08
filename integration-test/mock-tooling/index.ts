'use strict';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  getTokenInfo,
  getAccessToken,
  SERVICES_REALM,
  PASSWORD_CREDENTIALS_GRANT,
  mockTokeninfoEndpoint,
  mockAccessTokenEndpoint
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

const HOST = 'http://localhost:5001';
const TOKENINFO_ROUTE = '/tokeninfo';
const ACCESS_TOKEN_ROUTE = '/access_token';

const tokeninfoEndpoint = HOST + TOKENINFO_ROUTE;
const accessTokenEndpoint = HOST + ACCESS_TOKEN_ROUTE;

describe('Integration tests for mock tooling', () => {

  describe('tokeninfo endpoint', () => {

    it('should return error if token is not valid', () => {

      // given
      mockTokeninfoEndpoint({
        host: HOST,
        route: TOKENINFO_ROUTE
      });

      // when
      let promise = getTokenInfo(tokeninfoEndpoint, 'invalid');

      // then
      return expect(promise).to.rejected;
    });

    it('should return the tokeninfo if token is valid', function () {

      // given
      const validAuthToken = {
        'expires_in': 3600,
        'realm': 'services',
        'scope': ['uid'],
        'access_token': 'foo'
      };
      mockTokeninfoEndpoint({
        host: HOST,
        route: TOKENINFO_ROUTE,
        tokens: [validAuthToken]
      });

      // when
      let promise = getTokenInfo(tokeninfoEndpoint, 'foo');

      // then
      return expect(promise).to.become(validAuthToken);
    });

    it('should return the tokeninfo as often as defined', function () {

      // given
      const validAuthToken = {
        'expires_in': 3600,
        'realm': 'services',
        'scope': ['uid'],
        'access_token': 'foo'
      };
      mockTokeninfoEndpoint({
        host: HOST,
        route: TOKENINFO_ROUTE,
        tokens: [validAuthToken],
        times: 3
      });

      // when
      let promise = getTokenInfo(tokeninfoEndpoint, 'foo')
        .then((token: any) => {

          expect(token).to.equal(validAuthToken);
          return getTokenInfo(tokeninfoEndpoint, 'foo');
        })
        .then((token: any) => {

          expect(token).to.equal(validAuthToken);
          return getTokenInfo(tokeninfoEndpoint, 'foo');
        })
        .then((token: any) => {

          expect(token).to.equal(validAuthToken);
          return getTokenInfo(tokeninfoEndpoint, 'foo');
        });

      // then
      return expect(promise).to.rejected;
    });

  });

  describe('accessToken endpoint', () => {

    it('accessToken endpoint should return valid token', function () {

      // given
      const options = {
        realm: SERVICES_REALM,
        scopes: ['uid'],
        accessTokenEndpoint: accessTokenEndpoint,
        credentialsDir: 'integration-test/data/credentials',
        grantType: PASSWORD_CREDENTIALS_GRANT
      };
      mockAccessTokenEndpoint({
        host: HOST,
        route: ACCESS_TOKEN_ROUTE
      });
      mockTokeninfoEndpoint({
        host: HOST,
        route: TOKENINFO_ROUTE
      });

      // when
      let promise = getAccessToken(options)
        .then((token: any) => {

          return getTokenInfo(tokeninfoEndpoint, token.access_token);
        });

      // then
      return expect(promise).to.eventually.haveOwnProperty('access_token');
    });
  });
});
