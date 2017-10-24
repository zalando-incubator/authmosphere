import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  getTokenInfo,
  getAccessToken,
  mockTokeninfoEndpoint,
  mockAccessTokenEndpoint,
  cleanMock
} from '../../src/index';

import {
  Token,
  OAuthGrantType
} from '../../src/types';

chai.use(chaiAsPromised);
const expect = chai.expect;

const HOST = 'http://localhost:5001';
const TOKENINFO_ROUTE = '/tokeninfo';
const ACCESS_TOKEN_ROUTE = '/access_token';

const tokeninfoEndpoint = HOST + TOKENINFO_ROUTE;
const accessTokenEndpoint = HOST + ACCESS_TOKEN_ROUTE;

describe('mock tooling', () => {

  describe('tokeninfo endpoint', () => {

    afterEach(() => {
      cleanMock();
    });

    it('should return error if token is not valid', () => {

      // given
      mockTokeninfoEndpoint({
        url: tokeninfoEndpoint,
        times: 1
      });

      // when
      const promise = getTokenInfo(tokeninfoEndpoint, 'invalid');

      // then
      return expect(promise).to.be.rejected;
    });

    it('should return the tokeninfo if token is valid', function () {

      // given
      const validAuthToken = {
        'expires_in': 3600,
        'scope': ['uid'],
        'access_token': 'foo'
      };
      mockTokeninfoEndpoint({
        url: tokeninfoEndpoint,
        tokens: [validAuthToken],
        times: 1
      });

      // when
      const promise = getTokenInfo(tokeninfoEndpoint, 'foo');

      // then
      return expect(promise).to.become(validAuthToken);
    });

    it('should return the tokeninfo as often as defined', function () {

      // given
      const validAuthToken = {
        'expires_in': 3600,
        'scope': ['uid'],
        'access_token': 'foo'
      };
      mockTokeninfoEndpoint({
        url: tokeninfoEndpoint,
        tokens: [validAuthToken],
        times: 3
      });

      // when
      const promise = getTokenInfo(tokeninfoEndpoint, 'foo')
      .then((token) => {

        expect(token).to.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      })
      .then((token) => {

        expect(token).to.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      })
      .then((token) => {

        expect(token).to.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      });

      // then
      return expect(promise).to.rejected;
    });

    it('should return the tokeninfo Number.MAX_SAFE_INTEGER times when `times` option not defined', function () {

      // given
      const validAuthToken = {
        'expires_in': 3600,
        'scope': ['uid'],
        'access_token': 'foo'
      };
      mockTokeninfoEndpoint({
        url: tokeninfoEndpoint,
        tokens: [validAuthToken]
      });

      // when
      return getTokenInfo(tokeninfoEndpoint, 'foo')
      .then((token) => {

        expect(token).to.deep.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      })
      .then((token) => {

        expect(token).to.deep.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      })
      .then((token) => {

        expect(token).to.deep.equal(validAuthToken);
        return getTokenInfo(tokeninfoEndpoint, 'foo');
      })
      .then((token) => {

        expect(token).to.deep.equal(validAuthToken);
      });
    });

  });

  describe('accessToken endpoint', () => {

    afterEach(() => {
      cleanMock();
    });

    it('accessToken endpoint should return valid token', function () {

      // given
      const options = {
        scopes: ['uid'],
        accessTokenEndpoint: accessTokenEndpoint,
        credentialsDir: 'integration-test/data/credentials',
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT
      };
      mockAccessTokenEndpoint({
        url: accessTokenEndpoint
      });
      mockTokeninfoEndpoint({
        url: tokeninfoEndpoint
      });

      // when
      const promise = getAccessToken(options)
      .then((token: Token) => {

        return getTokenInfo(tokeninfoEndpoint, token.access_token);
      });

      // then
      return expect(promise).to.eventually.haveOwnProperty('access_token');
    });
  });
});
