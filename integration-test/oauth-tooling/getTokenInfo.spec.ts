import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Express from 'express';
import * as Http from 'http';

import {
  getTokenInfo
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

const port = '30001';
const host = `http://127.0.0.1:${port}`;
const tokenInfoEndpoint = '/oauth2/tokeninfo';

const validToken = 'valid-token';
const invalidToken = 'invalid-token';

function addStandardAuthenticationEndpoint(app, _validToken) {

  app.get(tokenInfoEndpoint, function(req, res) {

    const valid = req.query.access_token === _validToken;

    if (valid) {
      res
        .status(200)
        .send({
          'access_token': _validToken
        });
    } else {
      res
        .status(401)
        .send();
    }
  });
}

describe('getTokenInfo', () => {

  let authenticationServer: Http.Server;
  let authServerApp: Express.Application;

  // Setup AuthServer
  beforeEach(() => {
    authServerApp = Express();
    authenticationServer = authServerApp.listen(port);
  });

  // stop server after test
  afterEach(() => {
    authenticationServer.close();
  });

  it('should return error if token is not valid', () => {

    // given
    addStandardAuthenticationEndpoint(authServerApp, validToken);

    // when
    const url = `${host}${tokenInfoEndpoint}`;
    const promise = getTokenInfo(url, invalidToken);

    // then
    return expect(promise).be.rejected;
  });

  it('should return the token info if token is valid', function() {

    // given
    addStandardAuthenticationEndpoint(authServerApp, validToken);

    // when
    const url = `${host}${tokenInfoEndpoint}`;
    const promise = getTokenInfo(url, validToken);

    // then
    return expect(promise).to.become({
      'access_token': validToken
    });
  });
});
