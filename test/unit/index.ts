import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  TokenCache,
  getAccessToken,
  createAuthCodeRequestUri,
  OAuthGrantType,
  OAuthConfig
} from '../../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('oauth tooling', () => {

  describe('getAccessToken should throw TypeError', () => {

    const config = {
      accessTokenEndpoint: '/oauth2/access_token',
      credentialsDir: 'credentials',
      grantType: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
      redirectUri: '/some/redirect',
      code: 'some-code'
    };

    it('if credentialsDir is not defined', () => {
      const brokenConfig = {...config, credentialsDir: undefined} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });

    it('if accessTokenEndpoint is not defined', () => {
      const brokenConfig = {...config, accessTokenEndpoint: undefined} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });

    it('if grantType is not defined', () => {
      const brokenConfig = {...config, grantType: undefined} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });

    it('if redirectUri is not defined (in case of Authorization Code Grant)', () => {
      const brokenConfig = {...config, redirectUri: undefined} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });

    it('if code is not defined (in case of Authorization Code Grant)', () => {
      const brokenConfig = {...config, code: undefined} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });

    it('if refreshToken is not defined (in case of Refresh Token Grant)', () => {
      const brokenConfig = {...config, grantType: OAuthGrantType.REFRESH_TOKEN_GRANT} as unknown as OAuthConfig;

      expect(getAccessToken.bind(undefined, brokenConfig)).to.throw(TypeError);
    });
  });

  describe('createAuthCodeRequestUri', () => {

    it('should return the correct uri as string', () => {

      // given
      const authorizationEndpoint = '/oauth2/authorize';
      const clientId = 'clientID';
      const redirectUri = '/redirect';

      // when
      const result = createAuthCodeRequestUri(authorizationEndpoint, redirectUri, clientId);

      // then
      const expected = `${authorizationEndpoint}` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code`;

      expect(result).to.equal(expected);
    });

    it('should return the correct uri as string with queryParams specified', () => {

      // given
      const authorizationEndpoint = '/oauth2/authorize';
      const clientId = 'clientID';
      const redirectUri = '/redirect';
      const queryParams = {
        foo: 'bar'
      };

      // when
      const result = createAuthCodeRequestUri(authorizationEndpoint, redirectUri, clientId, queryParams);

      // then
      const expected = `${authorizationEndpoint}` +
        `?foo=bar` +
        `&client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code`;

      expect(result).to.equal(expected);
    });
  });

  describe('TokenCache', () => {

    it('should throw if tokenInfoEndpoint is not specified', () => {
      expect(() => {
        return new TokenCache({
          'foo': ['uid']
        }, {
          accessTokenEndpoint: '/access_token',
          credentialsDir: '/credentials',
          grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT
        } as any);
      }).to.throw(TypeError);
    });

    it('should throw an error if it tries to request a token with an invalid name', () => {

      const tokenCache = new TokenCache({
        'foo': ['uid']
      }, {
        accessTokenEndpoint: '/access_token',
        tokenInfoEndpoint: '/tokeninfo',
        credentialsDir: '/credentials',
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT
      } as any); // deactivate type system in order to test runtime behavior

      return expect(tokenCache.get('bar')).to.be.rejected;
    });
  });
});
