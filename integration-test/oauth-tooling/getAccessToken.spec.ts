import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as nock from 'nock';

import {
  getAccessToken,
  OAuthGrantType,
  PasswordCredentialsGrantConfig,
  ClientCredentialsGrantConfig,
  AuthorizationCodeGrantConfig,
  RefreshGrantConfig,
  OAuthConfig
} from '../../src';
// import { equal } from 'assert';

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
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      queryParams: { realm: '/services' }
    });

    //then
    return expect(promise).to.be.fulfilled;
  });

  it('should add optional body parameters to the request', () => {

    //given
    nock(oAuthServerHost)
      .filteringRequestBody((body) => {
        expect(body).to.contain('foo=bar');
        return body;
      })
      .post(accessTokenEndpoint)
      .reply(HttpStatus.OK, { 'access_token': accessToken });

    //when
    const promise = getAccessToken({
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      bodyParams: { foo: 'bar' }
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
    } as any); // deactivate type system in order to test runtime behavior

    // then
    return expect(promise).to.be.rejected;
  });

  describe('password credentials grant', () => {

    const passwordCredentialsOAuthOptions: PasswordCredentialsGrantConfig = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
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
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken({
        ...passwordCredentialsOAuthOptions,
        credentialsDir: 'integration-test/data/not-existing'
      });

      // then
      return expect(promise).to.be.rejected;
    });

    it('should throw TypeError if credentials are not defined', () => {

      // given
      const authConfig = {
        ...passwordCredentialsOAuthOptions,
        ...{
          credentialsDir: undefined,
          clientId: undefined,
          clientSecret: undefined
        }
      } as any as PasswordCredentialsGrantConfig;

      const result = () => getAccessToken(authConfig);

      // then
      return expect(result).to.throw(TypeError);
    });

    it('should resolve, if client credentials are passed in config', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(HttpStatus.OK, { access_token: accessToken });

      const config = {
        ...passwordCredentialsOAuthOptions,
        ...{
          credentialsDir: undefined,
          clientId: validUserName,
          clientSecret: validUserPassword,
          applicationUsername: validUserName,
          applicationPassword: validUserPassword
        }
      } as PasswordCredentialsGrantConfig;

      // when
      const promise = getAccessToken(config);

      // then
      return expect(promise).to.become({ access_token: accessToken });
    });

    it('should fail, if just client credentials are passed in config with password credentials grant', () => {

      // given
      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(HttpStatus.OK, { access_token: accessToken });

      // when
      const promise = getAccessToken({
        ...passwordCredentialsOAuthOptions,
        ...{
          credentialsDir: undefined,
          clientId: validUserName,
          clientSecret: validUserPassword
        } as any as OAuthConfig
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

    it('should be rejected with correct error message when response contains error object', () => {

      // given
      const status = 400;
      const error = 'invalid_request';
      const errorDescription = 'missing parameter business_partner_id';

      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(status, {
          error,
          error_description: errorDescription
        });

      // when
      const promise = getAccessToken(passwordCredentialsOAuthOptions);

      // then
      return expect(promise).to.be.rejected.and.to.eventually.deep.equal({
        error: { status, error, errorDescription },
        message: `Error requesting access token from ${oAuthServerHost}${accessTokenEndpoint}`
      });
    });

    it('should be rejected with correct error message when response contains empty error object', () => {

      // given
      const status = 400;
      const customError = {
        foo: 'bar'
      };

      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(status, customError);

      // when
      const promise = getAccessToken(passwordCredentialsOAuthOptions);

      // then
      return expect(promise).to.be.rejected.and.to.eventually.deep.equal({
        error: {
          error: customError,
          errorDescription: undefined,
          status
        },
        message: `Error requesting access token from ${oAuthServerHost}${accessTokenEndpoint}`
      });
    });

    it('should be rejected with correct error message when response is empty', () => {

      // given
      const status = 400;

      nock(oAuthServerHost)
        .post(accessTokenEndpoint)
        .reply(status);

      // when
      const expectedResult = {
        error: {
          message: `invalid json response body at ${oAuthServerHost}${accessTokenEndpoint} reason: Unexpected end of JSON input`,
          type: 'invalid-json'
        },
        message: `Error requesting access token from ${oAuthServerHost}${accessTokenEndpoint}`
      };

      //then
      const promise = getAccessToken(passwordCredentialsOAuthOptions)

      // Workaround, as deep equal on error objects is nor reliable in chai at the moment
        .catch((e) => {
          const equalResult = e.message === expectedResult.message &&
            e.error.message === expectedResult.error.message &&
            e.error.type === expectedResult.error.type;
          return Promise.reject(equalResult);
        });

      return expect(promise).to.be.rejected.become(true);
    });
  });

  describe('client credentials grant', () => {

    const clientCredentialsOAuthOptions: ClientCredentialsGrantConfig = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
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

    const authCodeOAuthOptions: AuthorizationCodeGrantConfig = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
      code: validCode,
      redirectUri: validRedirectUri
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
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

    const clientCredentialsOAuthOptions: RefreshGrantConfig = {
      scopes: ['campaign.edit_all', 'campaign.read_all'],
      accessTokenEndpoint: `${oAuthServerHost}${accessTokenEndpoint}`,
      credentialsDir: 'integration-test/data/credentials',
      grantType: OAuthGrantType.REFRESH_TOKEN_GRANT,
      refreshToken: validRefreshToken
    };

    it('should resolve with access token if valid', () => {

      // given
      nock(oAuthServerHost)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .matchHeader('Authorization', `Basic ${clientSecret}`)
        .post(accessTokenEndpoint, {
          grant_type: OAuthGrantType.REFRESH_TOKEN_GRANT,
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
