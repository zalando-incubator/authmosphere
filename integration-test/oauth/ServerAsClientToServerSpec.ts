'use strict';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as NodeURL from 'url';
import * as HttpStatus from 'http-status';
import * as Express from 'express';
import * as Http from 'http';
import * as fetch from 'node-fetch';

import { OAuthConfiguration } from '../../src/oauth/OAuthConfiguration';
import { OAuthService, requireScopes } from '../../src/oauth/OAuthService';

chai.use(chaiAsPromised);
const expect = chai.expect;
const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';


describe('OAuth integration test for client use cases', () => {

  let config: OAuthConfiguration;
  let oauthService: OAuthService;
  let authenticationServer: Http.Server;
  let authServerApp: Express.Application;

  /**
   * Mock data
   */
  beforeEach(function() {

    config = new OAuthConfiguration();
    config
     .addPublicEndpoints([ '/public', '/healthcheck' ])
     .setAuthServerUrl( NodeURL.parse('http://127.0.0.1:30001/oauth2/access_token'))
     .setCredentialsDir('integration-test/credentials');

    oauthService = new OAuthService(config);
  });

  // Setup AuthServer
  beforeEach(() => {
    authServerApp = Express();

    authenticationServer = authServerApp.listen(30001);
  });

  // stop server after test
  afterEach(() => {
    authenticationServer.close();
  });

  it('should return the Bearer token', function() {

    //given
    setupTestEnvironment('Basic c3R1cHNfY2FtcC1mcm9udGVuZF80NTgxOGFkZC1jNDdkLTQ3MzEtYTQwZC1jZWExZmZkMGUwYzk6Nmk1Z2hCI1MyaUJLKSVidGI3JU14Z3hRWDcxUXIuKSo=');

    //when
    let bearer = oauthService.getBearer("campaing.edit_all campaign.read_all")
    .then((token) => {
        return token;
      });

      //then
    return expect(bearer).to.become('4b70510f-be1d-4f0f-b4cb-edbca2c79d41');
  });

  it('should return unauthorized', function() {

    //given
    setupTestEnvironment('invalid');

    //when
    let bearer = oauthService.getBearer("campaing.edit_all campaign.read_all")
    .then((token) => {
        return token;
      });

      //then
    return expect(bearer).to.become(undefined);
  });

// Setup API server
function setupTestEnvironment(authHeader: string) {
  authServerApp.post('/oauth2/access_token', function(req, res) {

    let valid = req.headers['authorization'] === authHeader;
      if (valid) {
        res
        .status(200)
        .send({
          "expires_in": 3515,
          "token_type": "Bearer",
          "realm": "employees",
          "scope": [
            "campaign.read_all"
          ],
          "grant_type": "password",
          "uid": "Mustermann",
          "access_token": "4b70510f-be1d-4f0f-b4cb-edbca2c79d41"
        });
      } else {
        res
          .status(401)
          .send('Unauthorized');
        }
      });
    }
});
