import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as HttpStatus from 'http-status';
import * as nock from 'nock';

import {
  TokenCache,
  PASSWORD_CREDENTIALS_GRANT,
  SERVICES_REALM
} from '../../src/index';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('tokenCache', () => {

  let oauthConfig = {};
  const oauthHost = 'http://auth.zalando.com/oauth2';

  before(() => {
    oauthConfig = {
      realm: SERVICES_REALM,
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
      .post('/access_token?realm=services')
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
    const accessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: accessToken
      })
      .get('/tokeninfo?access_token=' + accessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': accessToken
      });

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    let promise = tokenService.get('nucleus')
      .then((tokeninfo) => {

        return tokeninfo.access_token;
    });

    // then
    return expect(promise).to.become(accessToken);
  });

  it('#get should resolve with the cached token if there is a valid one', () => {

    // given
    const accessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    const tokeninfo = {
      'expires_in': 3600,
      'token_type': 'Bearer',
      'realm': 'employees',
      'scope': ['nucleus.write', 'nucleus.read'],
      'grant_type': PASSWORD_CREDENTIALS_GRANT,
      'uid': 'uid',
      'access_token': accessToken
    };

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: accessToken
      })
      .get('/tokeninfo?access_token=' + accessToken)
      .times(2)
      .reply(HttpStatus.OK, tokeninfo);

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    let promise = tokenService.get('nucleus')
      .then(() => {

        return tokenService.get('nucleus')
          .then((data) => {

            return data.access_token;
          });
      });

    // then
    return expect(promise).to.become(accessToken);
  });

  it('#get should resolve with a new token if the cached one is expired', () => {

    // given
    const firstAccessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    const secondAccessToken = '9sdf8fd8-be1d-4f0f-b4cb-54nk66n45knk';

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: firstAccessToken
      })
      .get('/tokeninfo?access_token=' + firstAccessToken)
      .reply(HttpStatus.OK, {
        // make the first access token expire immediately
        'expires_in': 1,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': firstAccessToken
      })
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: secondAccessToken
      })
      .get('/tokeninfo?access_token=' + secondAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': secondAccessToken
      });

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    let promise = tokenService.get('nucleus')
      .then(() => {

        return tokenService.get('nucleus')
          .then((tokeninfo) => {

            return tokeninfo.access_token;
          });
      });

    // then
    return expect(promise).to.become(secondAccessToken);
  });

  it('#get should resolve with a new token if the cached one is invalid (but not expired)', () => {

    // given
    const firstAccessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    const secondAccessToken = '9sdf8fd8-be1d-4f0f-b4cb-54nk66n45knk';

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: firstAccessToken
      })
      .get('/tokeninfo?access_token=' + firstAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': firstAccessToken
      })
      .get('/tokeninfo?access_token=' + firstAccessToken)
      .reply(HttpStatus.BAD_REQUEST, {
        error: 'invalid_request',
        error_description: 'Access token not valid'
      })
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: secondAccessToken
      })
      .get('/tokeninfo?access_token=' + secondAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': secondAccessToken
      });

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    let promise = tokenService.get('nucleus')
      .then(() => {
        return tokenService.get('nucleus')
          .then((tokeninfo) => {

            return tokeninfo.access_token;
          });
      });

    // then
    return expect(promise).to.become(secondAccessToken);
  });

  it('#refreshToken should request a new token even if there is a valid one', () => {

    // given
    const firstAccessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    const secondAccessToken = '9sdf8fd8-be1d-4f0f-b4cb-54nk66n45knk';

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: firstAccessToken
      })
      .get('/tokeninfo?access_token=' + firstAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': firstAccessToken
      })
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: secondAccessToken
      })
      .get('/tokeninfo?access_token=' + secondAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': secondAccessToken
      });

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    let promise = tokenService.get('nucleus')
      .then(() => {

        return tokenService.refreshToken('nucleus')
          .then((tokeninfo) => {

            return tokeninfo.access_token;
          });
      });

    // then
    return expect(promise).to.become(secondAccessToken);
  });

  it('#refreshAllTokens should request a new token for every tokenName', () => {

    // given
    const firstAccessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
    const secondAccessToken = '9sdf8fd8-be1d-4f0f-b4cb-54nk66n45knk';

    nock(oauthHost)
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: firstAccessToken
      })
      .get('/tokeninfo?access_token=' + firstAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['nucleus.write', 'nucleus.read'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': firstAccessToken
      })
      .post('/access_token?realm=/services')
      .reply(HttpStatus.OK, {
        access_token: secondAccessToken
      })
      .get('/tokeninfo?access_token=' + secondAccessToken)
      .reply(HttpStatus.OK, {
        'expires_in': 3600,
        'token_type': 'Bearer',
        'realm': 'employees',
        'scope': ['all'],
        'grant_type': PASSWORD_CREDENTIALS_GRANT,
        'uid': 'uid',
        'access_token': secondAccessToken
      });

    // when
    const tokenService = new TokenCache({
      'nucleus': ['nucleus.write', 'nucleus.read'],
      'halo': ['all']
    }, oauthConfig);

    return tokenService.refreshAllTokens().then(tokens => {
      expect(tokens['nucleus'].access_token).to.equal(firstAccessToken);
      expect(tokens['halo'].access_token).to.equal(secondAccessToken);
    });
  });
});
