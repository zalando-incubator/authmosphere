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
  let resourceServer: Http.Server;
  let authServerApp: Express.Application;


  /**
   * Mock data
   */
  beforeEach(function() {

    config = new OAuthConfiguration();
    config
     .addPublicEndpoints([ '/public', '/healthcheck' ])
     .setAuthServerUrl( NodeURL.parse('http://127.0.0.1:30001/oauth2/tokeninfo')
    );

    oauthService = new OAuthService(config);
  });

  // Setup API server
  beforeEach(() => {
    var app = Express();

    app.use(oauthService.oauthMiddleware());

    app.get('/resource/user', requireScopes(['campaign.readall', 'campaign.editall']), function(req, res) {
      res.json({
        "userName": "JohnDoe",
        "lastLogin": "2015-12-12"
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


  describe('setup', () => {
    it('should read user.json');
    it('should read client.json');
    it('should only read if file\'s time stamp has changed');
  });

  describe('baerer', () => {
    it('should be loaded from auth server', () => {

    });
  })
});
