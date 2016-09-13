import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  TokenCache,
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  getAccessToken,
  createAuthCodeRequestUri,
  SERVICES_REALM,
  EMPLOYEES_REALM,
  AUTHORIZATION_CODE_GRANT,
  PASSWORD_CREDENTIALS_GRANT,
  REFRESH_TOKEN_GRANT
} from '../../src/index';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('oauth tooling', () => {

  let requestMock: any;
  let responseMock: any;

  before(() => {

    requestMock = {};

    responseMock = {};
    responseMock.sendStatus = function(status: string) {
      this.status = status;
    };
  });

  describe('getAccessToken should throw TypeError', () => {

    let config = {
      realm: SERVICES_REALM,
      accessTokenEndpoint: '/oauth2/access_token',
      credentialsDir: 'credentials',
      grantType: AUTHORIZATION_CODE_GRANT,
      redirectUri: '/some/redirect',
      code: 'some-code'
    };

    it('if credentialsDir is not defined', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        credentialsDir: undefined
      }))).to.throw(TypeError);
    });

    it('if accessTokenEndpoint is not defined', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        accessTokenEndpoint: undefined
      }))).to.throw(TypeError);
    });

    it('if grantType is not defined', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        grantType: undefined
      }))).to.throw(TypeError);
    });

    it('if realm is not defined', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        realm: undefined
      }))).to.throw(TypeError);
    });

    it('if redirectUri is not defined (in case of Authorization Code Grant)', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        redirectUri: undefined
      }))).to.throw(TypeError);
    });

    it('if code is not defined (in case of Authorization Code Grant)', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        code: undefined
      }))).to.throw(TypeError);
    });

    it('if refreshToken is not defined (in case of Refresh Token Grant)', () => {
      expect(getAccessToken.bind(undefined, Object.assign({}, config, {
        grantType: REFRESH_TOKEN_GRANT
      }))).to.throw(TypeError);
    });
  });

  describe('createAuthCodeRequestUri', () => {

    it('should return the correct uri as string', () => {

      // given
      const authorizationEndpoint = '/oauth2/authorize';
      const clientId = 'clientID';
      const redirectUri = '/redirect';

      // when
      const result = createAuthCodeRequestUri(authorizationEndpoint, clientId,
        redirectUri);

      // then
      const expected = authorizationEndpoint +
        '?client_id=' + clientId +
        '&redirect_uri=' + redirectUri +
        '&response_type=code' +
        '&realm=' + EMPLOYEES_REALM;

      expect(result).to.equal(expected);
    });
  });

  describe('requireScopesMiddleware', () => {

    it('should reject request with 403 if required scopes are not met', () => {

        // given
        requestMock.scopes = ['uid', 'test'];
        const requiredScopes = ['uid', 'test', 'additional'];
        let called = false;
        let next = () => {
          called = true;
        };

        // when
        requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

        // then
        expect(called).to.be.false;
        expect(responseMock.status).to.equal(403);
      });

    it('should call #next if required scopes are met', () => {

      // given
      requestMock.scopes = ['uid', 'test'];
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      expect(called).to.be.true;
    });

    it('should call #next also if user has a superset of the required scopes', () => {

      // given
      requestMock.scopes = ['uid', 'test', 'additionalScope'];
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      expect(called).to.be.true;
    });
  });

  describe('handleOAuthRequestMiddleware', () => {

    it('should call #next on public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      })({ 'originalUrl': '/healthcheck' }, responseMock, next);

      // then
      expect(called).to.be.true;
    });

    it('should not call #next when non-public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      })({ 'originalUrl': '/privateAPI', headers: {} }, responseMock, next);

      // then
      expect(called).to.be.false;
    });
  });

  describe('TokenCache', () => {

    it('should throw if tokenInfoEndpoint is not specified', () => {

      expect(() => {
        return new TokenCache({
          'foo': ['uid']
        }, {
          realm: SERVICES_REALM,
          accessTokenEndpoint: '/access_token',
          credentialsDir: '/credentials',
          grantType: PASSWORD_CREDENTIALS_GRANT
        });
      }).to.throw(TypeError);
    });

    it('should throw an error if it tries to request a token with an invalid name', () => {

      let tokenCache = new TokenCache({
        'foo': ['uid']
      }, {
        realm: SERVICES_REALM,
        accessTokenEndpoint: '/access_token',
        tokenInfoEndpoint: '/tokeninfo',
        credentialsDir: '/credentials',
        grantType: PASSWORD_CREDENTIALS_GRANT
      });
      return expect(tokenCache.get('bar')).to.be.rejected;
    });
  });
});
