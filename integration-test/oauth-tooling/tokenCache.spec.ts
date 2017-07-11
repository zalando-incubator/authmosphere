import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as nock from 'nock';
import * as lolex from 'lolex';

import {
  TokenCache,
  DEFAULT_PERCENTAGE_LEFT,
  PASSWORD_CREDENTIALS_GRANT
} from '../../src/index';

import { OAuthConfig } from '../../src/types/OAuthConfig';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('tokenCache', () => {

  let oauthConfig: OAuthConfig;
  const oauthHost = 'http://auth.zalando.com/oauth2';

  const defaultAccessTokenValue = 'foo';
  const defaultTokenInfoResponse = {
      expires_in: 3600,
      token_type: 'Bearer',
      scope: ['nucleus.write', 'nucleus.read'],
      grant_type: PASSWORD_CREDENTIALS_GRANT,
      uid: 'uid',
      access_token: defaultAccessTokenValue
    };

  before(() => {
    oauthConfig = {
      accessTokenEndpoint: oauthHost + '/access_token',
      tokenInfoEndpoint: oauthHost + '/tokeninfo',
      credentialsDir: 'integration-test/data/credentials',
      grantType: PASSWORD_CREDENTIALS_GRANT
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('#get should reject if there is no token and is not able to request a new one', () => {

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

  it('#get should resolve with a new token if there is none yet', () => {

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

  it('#get should resolve with the cached token if there is a valid one', () => {

    // given
    const clock = lolex.install();
    const initialLifetime = 3600;
    const timeBeforeExpiry = initialLifetime * DEFAULT_PERCENTAGE_LEFT * 1000 - 1;

    nock(oauthHost)
    .post('/access_token')
    .reply(HttpStatus.OK, {
      access_token: defaultAccessTokenValue,
      expires_in: initialLifetime
    })
    .get('/tokeninfo')
    .query({ access_token: defaultAccessTokenValue })
    .times(2)
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

  it('#get should resolve with a new token if the cached one is expired', () => {

    // given
    const clock = lolex.install();
    const initialLifetime = 3600;
    const timeUntilExpiry = initialLifetime * DEFAULT_PERCENTAGE_LEFT * 1000 + 1;

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

  it('#get should resolve with a new token if the cached one is invalid (but not expired)', () => {

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
      .get('/tokeninfo')
      .query({ access_token: defaultAccessTokenValue })
      .reply(HttpStatus.BAD_REQUEST, {
        error: 'invalid_request',
        error_description: 'Access token not valid'
      })
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
      .then(() => tokenService.get('nucleus'))
      .then((token) => token.access_token);

    // then
    return expect(promise).to.become(otherAccessTokenValue);
  });

  it('#refreshToken should request a new token even if there is a valid one', () => {

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

  it('#refreshAllTokens should request a new token for every tokenName', () => {

    // given
    const otherAccessTokenValue = 'bar';

    nock(oauthHost)
      .post('/access_token', function (body: any) {
        return body.scope === 'nucleus.write nucleus.read';
      })
      .reply(HttpStatus.OK, {
        access_token: defaultAccessTokenValue
      })
      .get('/tokeninfo')
      .query({ access_token: defaultAccessTokenValue })
      .reply(HttpStatus.OK, defaultTokenInfoResponse)
      .post('/access_token', function (body: any) {
        return body.scope === 'all';
      })
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
        expect(tokens['nucleus'].access_token).to.equal(defaultAccessTokenValue);
        expect(tokens['halo'].access_token).to.equal(otherAccessTokenValue);
      });
  });
});
