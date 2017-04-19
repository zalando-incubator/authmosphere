import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Express from 'express';
import * as Http from 'http';

import {
  PASSWORD_CREDENTIALS_GRANT,
  getTokenInfo
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('getTokenInfo', () => {

  let authenticationServer: Http.Server;
  let authServerApp: Express.Application;

  // Setup AuthServer
  beforeEach(() => {
    authServerApp = Express();
    authenticationServer = authServerApp.listen(30001);
  });

  // stop server after test
  afterEach(() => {
    authenticationServer.close();
  });

  function addStandardAuthenticationEndpoint() {

    authServerApp.get('/oauth2/tokeninfo', function(req, res) {
      const valid = req.query.access_token === '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';

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
          .send({
            'error': 'invalid_request',
            'error_description': 'Access Token not valid'
          });
      }
    });
  }

  it('should return error if token is not valid', () => {

    // given
    const authToken = 'invalid';
    addStandardAuthenticationEndpoint();

    // when
    const url = 'http://127.0.0.1:30001/oauth2/tokeninfo';
    const promise = getTokenInfo(url, authToken)
    .then((jsonData) => {

      return jsonData;
    });

    // then
    return expect(promise).be.rejected;
  });

  it('should return the token info if token is valid', function() {

    // given
    const authToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    addStandardAuthenticationEndpoint();

    // when
    const url = 'http://127.0.0.1:30001/oauth2/tokeninfo';
    const promise = getTokenInfo(url, authToken)
    .then((jsonData) => {

      return jsonData;
    });

    // then
    return expect(promise).to.become({
      'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41',
      'expires_in': 3515,
      'grant_type': 'password',
      'realm': 'employees',
      'scope': [
        'campaign.editall',
        'campaign.readall'
      ],
      'token_type': 'Bearer',
      'uid': 'services'
    });
  });
});
