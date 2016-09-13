import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Express from 'express';
import * as Http from 'http';
import * as HttpStatus from 'http-status';
import * as bodyParser from 'body-parser';
import * as nock from 'nock';

import {
  getAccessToken,
  PASSWORD_CREDENTIALS_GRANT,
  AUTHORIZATION_CODE_GRANT,
  REFRESH_TOKEN_GRANT,
  SERVICES_REALM,
  EMPLOYEES_REALM
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

function setupTestEnvironment(authHeader: string, authServerApp: Express.Application) {

  authServerApp.use(bodyParser.urlencoded({extended: true}));
  authServerApp.post('/oauth2/access_token', function(req, res) {
    if (req.body.grant_type === PASSWORD_CREDENTIALS_GRANT) {
      let valid = req.headers['authorization'] === authHeader;
      if (valid) {
        res
          .status(HttpStatus.OK)
          .send({'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'});
      } else {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .send({
            error: 'internal_error',
            error_description: 'Request method GET not supported'
          });
      }
    } else {
      if (req.body.code && req.body.redirect_uri && req.headers['authorization'] === authHeader) {
        res
          .status(HttpStatus.OK)
          .send({'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'});
      } else {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .send({
            error: 'internal_error',
            error_description : 'Request method GET not supported'
          });
      }
    }

  });
}

describe('getAccessToken', () => {

  let authenticationServer: Http.Server;
  let authServerApp: Express.Application;

  let getAccessTokenOptions;

  // Setup AuthServer
  beforeEach(() => {
    authServerApp = Express();
    authenticationServer = authServerApp.listen(30001);
  });

  // stop server after test
  afterEach(() => {
    authenticationServer.close();
    nock.cleanAll();
  });

  describe('password credentials grant', () => {

    before(() => {
      getAccessTokenOptions = {
        realm: SERVICES_REALM,
        scopes: ['campaing.edit_all', 'campaign.read_all'],
        accessTokenEndpoint: 'http://127.0.0.1:30001/oauth2/access_token',
        credentialsDir: 'integration-test/data/credentials',
        grantType: PASSWORD_CREDENTIALS_GRANT
      };
    });

    it('should become the access token', function() {

      //given
      setupTestEnvironment('Basic c3R1cHNfY2FtcC1mcm9udGVuZF80NTgxOGFkZC1jNDdkLTQ3MzEtYTQwZC1jZWExZmZkMGUwYzk6Nmk1Z2hCI1MyaUJLKSVidGI3JU14Z3hRWDcxUXIuKSo=', authServerApp);

      //when
      let promise = getAccessToken(getAccessTokenOptions);

      //then
      return expect(promise).to.become({access_token: '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'});
    });

    it('should be rejected if authorization header is invalid', function() {

      //given
      setupTestEnvironment('invalid', authServerApp);

      //when
      let promise = getAccessToken(getAccessTokenOptions);

      //then
      return expect(promise).to.be.rejected;
    });

    it('should be rejected if credentials can not be read', function() {

      //given
      setupTestEnvironment('invalid', authServerApp);

      //when
      let promise = getAccessToken(Object.assign({}, getAccessTokenOptions, {
        credentialsDir: 'integration-test/data/not-existing'
      }));

      //then
      return expect(promise).to.be.rejected;
    });

  });

  describe('authorization code grant', () => {

    let getAccessTokenOptionsAuthorization;

    before(() => {
      getAccessTokenOptionsAuthorization = {
        realm: SERVICES_REALM,
        scopes: ['campaing.edit_all', 'campaign.read_all'],
        accessTokenEndpoint: 'http://127.0.0.1:30001/oauth2/access_token',
        credentialsDir: 'integration-test/data/credentials',
        code: 'foo',
        redirectUri: 'http://127.0.0.1:30001/oauth2/access_token',
        grantType: AUTHORIZATION_CODE_GRANT
      };
    });

    it('should become the access token', function() {

      //given
      setupTestEnvironment('Basic c3R1cHNfY2FtcC1mcm9udGVuZF80NTgxOGFkZC1jNDdkLTQ3MzEtYTQwZC1jZWExZmZkMGUwYzk6Nmk1Z2hCI1MyaUJLKSVidGI3JU14Z3hRWDcxUXIuKSo=', authServerApp);

      //when
      let bearer = getAccessToken(getAccessTokenOptionsAuthorization)
        .then((data) => {
          return data;
        });

      //then
      return expect(bearer).to.become({access_token: '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'});
    });

    it('should return error message if authorization header is invalid', function() {

      //given
      setupTestEnvironment('invalid', authServerApp);

      //when
      let promise = getAccessToken(getAccessTokenOptionsAuthorization);

      //then
      return expect(promise).to.be.rejected;
    });

    it('should be rejected if credentials can not be read', function() {

      //given
      setupTestEnvironment('invalid', authServerApp);

      //when
      let promise = getAccessToken(Object.assign({}, getAccessTokenOptionsAuthorization, {
        credentialsDir: 'integration-test/data/not-existing'
      }));

      //then
      return expect(promise).to.be.rejected;
    });

    it('getAccessToken should create request with correct body parameters', function() {

      // given
      const host = 'http://127.0.0.1:30001/oauth2';
      const options = {
        realm: SERVICES_REALM,
        scopes: ['campaing.edit_all', 'campaign.read_all'],
        accessTokenEndpoint: `${host}/access_token`,
        credentialsDir: 'integration-test/data/credentials',
        grantType: AUTHORIZATION_CODE_GRANT,
        code: 'foo-bar',
        redirectUri: '/redirect/'
      };

      const responseObject = { 'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41' };

      nock(host)
        .post('/access_token?realm=/services', (body) => {

          if (body.grant_type !== options.grantType) {
            return false;
          }

          if (body.scope !== options.scopes.join(' ')) {
            return false;
          }

          if (body.redirect_uri !== options.redirectUri) {
            return false;
          }

          if (body.code !== options.code) {
            return false;
          }

          return true;
        })
        .reply(HttpStatus.OK, responseObject);

      // when
      let promise = getAccessToken(options);

      // then
      return expect(promise).to.become(responseObject);
    });
  });

  describe('refresh token grant', () => {

    it('should become the access token', function () {

      // given
      const host = 'http://127.0.0.1:30001/oauth2';
      const options =  {
        realm: EMPLOYEES_REALM,
        accessTokenEndpoint: `${host}/access_token`,
        credentialsDir: 'integration-test/data/credentials',
        grantType: REFRESH_TOKEN_GRANT,
        refreshToken: 'foo-bar-xxxx'
      };

      const responseObject = { 'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41' };

      nock(host)
        .post('/access_token?realm=/employees', (body) => {

          if (body.grant_type !== options.grantType) {
            return false;
          }

          if (body.refresh_token !== options.refreshToken) {
            return false;
          }

          return true;
        })
        .reply(HttpStatus.OK, responseObject);

      // when
      let promise = getAccessToken(options);

      // then
      return expect(promise).to.become(responseObject);
    });
  });
});
