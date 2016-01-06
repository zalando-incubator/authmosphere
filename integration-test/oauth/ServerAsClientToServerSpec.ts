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

  // Setup API server
  beforeEach(() => {

    authServerApp.get('/oauth2/access_token', function(req, res) {
console.log('blaaaaaa');
      //let valid = req.query.access_token === 'c3R1cHNfY2FtcC1mcm9udGVuZF80NTgxOGFkZC1jNDdkLTQ3MzEtYTQwZC1jZWExZmZkMGUwYzk6Nmk1Z2hCI1MyaUJLKSVidGI3JU14Z3hRWDcxUXIuKSo=';
      let valid = true;
      if (valid) {
        console.log('token is valid', req);
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
  });

  // stop server after test
  afterEach(() => {
    authenticationServer.close();
  });


  it.only('should return the Bearer token', function(done) {

    this.timeout(20000);

    let result = oauthService.getBearer("campaing.edit_all campaign.read_all")
    .then((token) => {
        console.log('received access token:', token);
    })
    .then(() => {
      setTimeout(done, 20000);
    });

  });
});

/**
  it('should return 401 if authorization header is not set', function() {

    // given
    addStandardAuthenticationEndpoint();

    // when
    const promise = fetch('http://127.0.0.1:30002/resource/user')
    .then((res) => {
      return res.status;
    });

    // then
    return expect(promise).to.become(HttpStatus.UNAUTHORIZED);
  });

  it('should return 401 if server response is != 200 ', function() {

    // given
    let authHeader = 'Bearer 4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    add500Endpoint();


    // when
    var promise = fetch('http://127.0.0.1:30002/resource/user', {
      method: 'GET',
      headers: {
        authorization: authHeader
      }
    })
    .then((res) => {
      return res.status;
    });

    // then
    return expect(promise).to.become(HttpStatus.UNAUTHORIZED);
  });


  it('should return 403 if scope is not granted', () => {

    // given
    let authHeader = 'Bearer 4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    addAuthenticationEndpointWithoutRequiredScopes();


    // when
    var promise = fetch('http://127.0.0.1:30002/resource/user', {
      method: 'GET',
      headers: {
        authorization: authHeader
      }
    })
    .then((res) => {
      return res.status;
    });

    // then
    return expect(promise).to.become(HttpStatus.FORBIDDEN);
  });


  it('should return 403 if uid matches not the resource owner \'services\'', () => {

    // given
    let authHeader = 'Bearer 4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    addWrongUserEndpoint();


    // when
    var promise = fetch('http://127.0.0.1:30002/resource/user', {
      method: 'GET',
      headers: {
        authorization: authHeader
      }
    })
    .then((res) => {
      return res.status;
    });

    // then
    return expect(promise).to.become(HttpStatus.FORBIDDEN);
  });


  it('should return the resource if token is valid, _all_ scopes are  granted and resource belongs to the service user', function() {

    // given
    let authHeader = 'Bearer 4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    addStandardAuthenticationEndpoint();

    // when
    var promise = fetch('http://127.0.0.1:30002/resource/user', {
      method: 'GET',
      headers: {
        authorization: authHeader
      }
    })
    .then((res: any) => {
      return res.json();
    })
    .then((jsonData) => {
      return jsonData;
    })

    // then
    return expect(promise).to.become({
      "userName": "JohnDoe",
      "lastLogin": "2015-12-12"
    });
  });
});


  function addStandardAuthenticationEndpoint() {

    authServerApp.get('/oauth2/tokeninfo', function(req, res) {
      let valid = req.query.access_token === '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';

      if (valid) {
        res
        .status(200)
        .send({
          "expires_in": 3515,
          "token_type": "Bearer",
          "realm": "employees",
          "scope": [
            "campaign.editall",
            "campaign.readall"
          ],
          "grant_type": "password",
          "uid": "services",
          "access_token": "4b70510f-be1d-4f0f-b4cb-edbca2c79d41"
        });
      } else {
        res
          .status(401)
          .send('Unauthorized');
      }
    });
  }

  function addAuthenticationEndpointWithoutRequiredScopes() {
    authServerApp.get('/oauth2/tokeninfo', function(req, res) {

      let valid = req.query.access_token === '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';

      if (valid) {
        res
        .status(200)
        .send({
          "expires_in": 3515,
          "token_type": "Bearer",
          "realm": "employees",
          "scope": [
            "campaign.readall"
          ],
          "grant_type": "password",
          "uid": "services",
          "access_token": "4b70510f-be1d-4f0f-b4cb-edbca2c79d41"
        });
      } else {
        res
          .status(401)
          .send('Unauthorized');
      }
    });
  }

  function add500Endpoint() {
    authServerApp.get('/oauth2/tokeninfo', function(req, res) {
      res
      .status(500)
      .send('');
    });
  }

  function addWrongUserEndpoint() {

    authServerApp.get('/oauth2/tokeninfo', function(req, res) {
      let valid = req.query.access_token === 'c3R1cHNfY2FtcC1mcm9udGVuZDpRT25EQVN6UWNlem8uZ2xoKGpjVm85cnlLeG1TW0B4Mw==';

      if (valid) {
        res
        .status(200)
        .send({
          "expires_in": 3515,
          "token_type": "Bearer",
          "realm": "employees",
          "scope": [
            "campaign.readall"
          ],
          "grant_type": "password",
          "uid": "Mustermann",
          "access_token": "c3R1cHNfY2FtcC1mcm9udGVuZDpRT25EQVN6UWNlem8uZ2xoKGpjVm85cnlLeG1TW0B4Mw=="
        });
      } else {
        res
          .status(401)
          .send('Unauthorized');
      }
    });
  }
*/
