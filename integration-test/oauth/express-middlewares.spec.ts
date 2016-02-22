'use strict';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as Express from 'express';
import * as Http from 'http';
import * as fetch from 'node-fetch';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  PASSWORD_CREDENTIALS_GRANT
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Integration tests for express middlewares', () => {

  let authenticationServer: Http.Server;
  let resourceServer: Http.Server;
  let authServerApp: Express.Application;

  // Setup API server
  beforeEach(() => {
    let app = Express();

    app.use(handleOAuthRequestMiddleware({
      publicEndpoints: [ '/public', '/healthcheck' ],
      tokenInfoEndpoint: 'http://127.0.0.1:30001/oauth2/tokeninfo'
    }));

    app.get('/resource/user', requireScopesMiddleware(['campaign.readall', 'campaign.editall']), function(req, res) {
      res.json({
        'userName': 'JohnDoe',
        'lastLogin': '2015-12-12'
      }).end();
    });

    resourceServer = app.listen(30002);
  });

  // Setup AuthServer
  beforeEach(() => {
    authServerApp = Express();
    authenticationServer = authServerApp.listen(30001);
  });

  // stop server after test
  afterEach(() => {
    resourceServer.close();
    authenticationServer.close();
  });

  function addStandardAuthenticationEndpoint() {

    authServerApp.get('/oauth2/tokeninfo', function(req, res) {
      let valid = req.query.access_token === '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';

      if (valid) {
        res
        .status(200)
        .send({
          'expires_in': 3515,
          'token_type': 'Bearer',
          'realm': 'employees',
          'scope': [
            'campaign.editall',
            'campaign.readall'
          ],
          'grant_type': PASSWORD_CREDENTIALS_GRANT,
          'uid': 'services',
          'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'
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
          'expires_in': 3515,
          'token_type': 'Bearer',
          'realm': 'employees',
          'scope': [
            'campaign.readall'
          ],
          'grant_type': PASSWORD_CREDENTIALS_GRANT,
          'uid': 'services',
          'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41'
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

  it('should return 401 if authorization header is not set', function()  {

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
    let promise = fetch('http://127.0.0.1:30002/resource/user', {
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
    let promise = fetch('http://127.0.0.1:30002/resource/user', {
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
    let promise = fetch('http://127.0.0.1:30002/resource/user', {
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
    });

    // then
    return expect(promise).to.become({
      'userName': 'JohnDoe',
      'lastLogin': '2015-12-12'
    });
  });
});
