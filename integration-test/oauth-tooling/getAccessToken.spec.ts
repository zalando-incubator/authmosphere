import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as nock from 'nock';

import {
  getAccessToken,
  PASSWORD_CREDENTIALS_GRANT,
  AUTHORIZATION_CODE_GRANT,
  REFRESH_TOKEN_GRANT,
  CLIENT_CREDENTIALS_GRANT
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('getAccessToken', () => {

  const oAuthServerHost = 'http://127.0.0.1:30001';
  const accessTokenEndpoint = '/oauth2/access_token';
  const accessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
  const clientSecret = 'bnVjbGV1c19jbGllbnQ6bnVjbGV1c19jbGllbnRfc2VjcmV0';
  const validUserName = 'Nucleus_user';
  const validUserPassword = 'Nucleus_user_pw';

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should add optional query parameters to the request', () => {

    //given
    nock(oAuthServerHost)
      .post(accessTokenEndpoint)
      .query({
        realm: '/services'
      })
      .reply(HttpStatus.OK, { 'access_token': accessToken });

    //when
    const promise = getAccessToken({
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: PASSWORD_CREDENTIALS_GRANT,
      queryParams: { realm: '/services' }
    });

    //then
    return expect(promise).to.be.fulfilled;
  });

  it('should be rejected, if grant type is unknown', function() {

    nock(oAuthServerHost)
    .post(accessTokenEndpoint)
    .reply(HttpStatus.OK);

    // when
    const promise = getAccessToken({
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: 'INVALID',
      queryParams: { realm: '/services' }
    });

    // then
    return expect(promise).to.be.rejected;
  });

  describe('password credentials grant', () => {

    const passwordCredentialsOAuthOptions = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: PASSWORD_CREDENTIALS_GRANT
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: PASSWORD_CREDENTIALS_GRANT,
          username: validUserName,
          password: validUserPassword,
          scope: 'campaign.edit_all campaign.read_all'
        })
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken(passwordCredentialsOAuthOptions);

      // then
      return expect(promise).to.become({ access_token: accessToken });
    });

    it('should be rejected if credentials cannot be read', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(HttpStatus.OK);

      // when
      const promise = getAccessToken({
        ...passwordCredentialsOAuthOptions,
        credentialsDir: 'integration-test/data/not-existing'
      });

      // then
      return expect(promise).to.be.rejected;
    });

    it('should be rejected if response is 401', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(401);

      // when
      const promise = getAccessToken(passwordCredentialsOAuthOptions);

      // then
      return expect(promise).to.be.rejected;
    });
  });

  describe('client credentials grant', () => {

    const clientCredentialsOAuthOptions = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: CLIENT_CREDENTIALS_GRANT
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: CLIENT_CREDENTIALS_GRANT,
          scope: 'campaign.edit_all campaign.read_all'
        })
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken(clientCredentialsOAuthOptions);

      // then
      return expect(promise).to.become({ access_token: accessToken });
    });

    it('should be rejected if credentials cannot be read', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(HttpStatus.OK);

      // when
      const promise = getAccessToken({
        ...clientCredentialsOAuthOptions,
        credentialsDir: 'integration-test/data/not-existing'
      });

      // then
      return expect(promise).to.be.rejected;
    });

    it('should be rejected if response is 401', () => {

      // given
      nock(oAuthServerHost)
      .post(accessTokenEndpoint)
      .reply(401);

      // when
      const promise = getAccessToken(clientCredentialsOAuthOptions);

      // then
      return expect(promise).to.be.rejected;
    });
  });

  describe('authorization code grant', () => {

    const validCode = '1234';
    const validRedirectUri = 'http://redirect.com';

    const authCodeOAuthOptions = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: AUTHORIZATION_CODE_GRANT,
      code: validCode,
      redirectUri: validRedirectUri
    };

    it('should resolve with access token if valid', function() {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: AUTHORIZATION_CODE_GRANT,
          code: validCode,
          redirect_uri: validRedirectUri,
          scope: 'campaign.edit_all campaign.read_all'
        })
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken(authCodeOAuthOptions);

      //then
      return expect(promise).to.become({access_token: '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'});
    });

    it('should be rejected if credentials cannot be read', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(HttpStatus.OK);

      // when
      const promise = getAccessToken({
        ...authCodeOAuthOptions,
        credentialsDir: 'integration-test/data/not-existing'
      });

      // then
      return expect(promise).to.be.rejected;
    });

    it('should be rejected if response is 401', () => {

      // given
      nock(oAuthServerHost)
      .post(accessTokenEndpoint)
      .reply(401);

      // when
      const promise = getAccessToken(authCodeOAuthOptions);

      // then
      return expect(promise).to.be.rejected;
    });
  });

  describe('refresh token grant', () => {

    const validRefreshToken = 'refresh';

    const clientCredentialsOAuthOptions = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: REFRESH_TOKEN_GRANT,
      refreshToken: validRefreshToken
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: REFRESH_TOKEN_GRANT,
          scope: 'campaign.edit_all campaign.read_all',
          refresh_token: validRefreshToken
        })
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken(clientCredentialsOAuthOptions);

      // then
      return expect(promise).to.become({ access_token: accessToken });
    });
  });
});
