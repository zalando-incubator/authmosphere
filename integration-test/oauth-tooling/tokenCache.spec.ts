import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as lolex from 'lolex';

import {
  TokenCache,
  defaultCacheConfig,
  OAuthGrantType
} from '../../src';

import { TokenCacheOAuthConfig } from '../../src/types/OAuthConfig';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('TokenCache', () => {

  let oauthConfig: TokenCacheOAuthConfig;
  const oauthHost = 'http://auth.zalando.com/oauth2';

  const defaultAccessTokenValue = 'foo';
  const defaultTokenInfoResponse = {
      expires_in: 3600,
      token_type: 'Bearer',
      scope: ['nucleus.write', 'nucleus.read'],
      grant_type: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      uid: 'uid',
      access_token: defaultAccessTokenValue
    };

  before(() => {
    oauthConfig = {
      accessTokenEndpoint: oauthHost + '/access_token',
      tokenInfoEndpoint: oauthHost + '/tokeninfo',
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('get', () => {

    it('should reject if there is no token configuration for given name', () => {

      // given
      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.INTERNAL_SERVER_ERROR);

      // when
      const tokenCache = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      // then
      return expect(tokenCache.get('foo')).to.be.rejected;
    });

    it('should reject if there is no token and is not able to request a new one', () => {

      // given
      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.INTERNAL_SERVER_ERROR);

      // when
      const tokenCache = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      // then
      return expect(tokenCache.get('nucleus')).to.be.rejected;
    });

    it('should resolve with a new token if there is none yet', () => {

      // given
      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse);

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      const promise = tokenService.get('nucleus')
        .then((token) => token.access_token);

      // then
      return expect(promise).to.become(defaultAccessTokenValue);
    });

    it('should resolve with the cached token if there is a valid one', () => {

      // given
      const clock = lolex.install();
      const initialLifetime = 3600;
      const timeBeforeExpiry = initialLifetime * (1 - defaultCacheConfig.percentageLeft) * 1000 - 1;

      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue,
          expires_in: initialLifetime
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse);

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      const promise = tokenService.get('nucleus')
        .then(() => clock.tick(timeBeforeExpiry))
        .then(() => tokenService.get('nucleus'))
        .then((token) => {
          clock.uninstall();
          return token.access_token;
        });

      // then
      return expect(promise).to.become(defaultAccessTokenValue);
    });

    it('should resolve with a new token if the cached one is expired', () => {

      // given
      const clock = lolex.install();
      const initialLifetime = 3600;
      const timeUntilExpiry = initialLifetime * (1 - defaultCacheConfig.percentageLeft) * 1000 + 1;

      const otherAccessTokenValue = 'bar';

      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue,
          expires_in: initialLifetime
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: otherAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: otherAccessTokenValue })
        .reply(HttpStatus.OK, {
          ...defaultTokenInfoResponse,
          access_token: otherAccessTokenValue
        });

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      const promise = tokenService.get('nucleus')
        .then(() => clock.tick(timeUntilExpiry))
        .then(() => tokenService.get('nucleus'))
        .then((token) => {
          clock.uninstall();
          return token.access_token;
        });

      // then
      return expect(promise).to.become(otherAccessTokenValue);
    });

    it('should resolve with a token that immediately expires if expires_in is not set', () => {

      // given
      const clock = lolex.install();
      const timeUntilExpiry = 1;

      const otherAccessTokenValue = 'bar';

      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: otherAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: otherAccessTokenValue })
        .reply(HttpStatus.OK, {
          ...defaultTokenInfoResponse,
          access_token: otherAccessTokenValue
        });

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      const promise = tokenService.get('nucleus')
        .then(() => clock.tick(timeUntilExpiry))
        .then(() => tokenService.get('nucleus'))
        .then((token) => {
          clock.uninstall();
          return token.access_token;
        });

      // then
      return expect(promise).to.become(otherAccessTokenValue);
    });
  });

  describe('refreshToken', () => {
    it('should request a new token even if there is a valid one', () => {

      // given
      const otherAccessTokenValue = 'bar';

      nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: otherAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: otherAccessTokenValue })
        .reply(HttpStatus.OK, {
          ...defaultTokenInfoResponse,
          access_token: otherAccessTokenValue
        });

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      const promise = tokenService.get('nucleus')
        .then(() => tokenService.refreshToken('nucleus'))
        .then((tokeninfo) => tokeninfo.access_token);

      // then
      return expect(promise).to.become(otherAccessTokenValue);
    });
  });

  describe('refreshAllTokens', () => {
    it(' should request a new token for every tokenName', () => {

      // given
      const otherAccessTokenValue = 'bar';

      nock(oauthHost)
        .post('/access_token', (body: any) =>
          body.scope === 'nucleus.write nucleus.read')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse)
        .post('/access_token', (body: any) =>
          body.scope === 'all')
        .reply(HttpStatus.OK, {
          access_token: otherAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: otherAccessTokenValue })
        .reply(HttpStatus.OK, {
          ...defaultTokenInfoResponse,
          access_token: otherAccessTokenValue
        });

      // when
      const tokenService = new TokenCache({
        'nucleus': ['nucleus.write', 'nucleus.read'],
        'halo': ['all']
      }, oauthConfig);

      return tokenService.refreshAllTokens()
        .then(tokens => {

          const nucleusToken = tokens['nucleus'] || { access_token: undefined };
          const haloToken = tokens['halo'] || { access_token: undefined };

          expect(nucleusToken.access_token).to.equal(defaultAccessTokenValue);
          expect(haloToken.access_token).to.equal(otherAccessTokenValue);
        });
    });
  });

  describe('resolveAccessTokenFactory', () => {

      it('should return a promise, evaluating the token', () => {

        // given
        nock(oauthHost)
        .post('/access_token')
        .reply(HttpStatus.OK, {
          access_token: defaultAccessTokenValue
        })
        .get('/tokeninfo')
        .query({ access_token: defaultAccessTokenValue })
        .reply(HttpStatus.OK, defaultTokenInfoResponse);

        // when
        const tokenService = new TokenCache({
          'nucleus': ['nucleus.write', 'nucleus.read'],
          'halo': ['all']
        }, oauthConfig);

        const evalFunction = tokenService.resolveAccessTokenFactory('nucleus');
        const promise = evalFunction();

        // then
        return expect(promise).to.become(defaultAccessTokenValue);
      });
    });
});
