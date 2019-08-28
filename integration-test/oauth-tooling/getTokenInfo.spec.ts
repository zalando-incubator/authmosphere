import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as nock from 'nock';
import * as HttpStatus from 'http-status';

import {
  getTokenInfo
} from '../../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

const oAuthServerHost = `http://127.0.0.1:30001`;
const validAccessToken = '4b70510f-be1d-4f0f-b4cb-edbca2c79d41';
const invalidAccessToken = 'invalid';
const tokenInfoEndpoint = '/oauth2/tokeninfo';

describe('getTokenInfo', () => {

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should return error if token is not valid', () => {

    // given
    nock(oAuthServerHost)
    .get(tokenInfoEndpoint)
    .query({ access_token: invalidAccessToken })
    .reply(HttpStatus.UNAUTHORIZED, { error: 'invalid_token' });

    // when
    const promise = getTokenInfo(`${oAuthServerHost}${tokenInfoEndpoint}`, invalidAccessToken);

    // then
    return expect(promise).to.be.rejected;
  });

  it('should return no fetch error if call fails', () => {

    // when
    const promise = getTokenInfo(`http://oauth-mock:5001/tokeninfo`, validAccessToken);

    // then
    return expect(promise).to.be.rejected
      .then((error) => {
        expect(error).to.deep.equal({
          message: 'Error validating token via http://oauth-mock:5001/tokeninfo',
          error: {
            errorDescription: 'tokenInfo endpoint not reachable '
          }
          });
      });
  });

  it('should return the token info if token is valid', function() {

    // given
    nock(oAuthServerHost)
    .get(tokenInfoEndpoint)
    .query({ access_token: validAccessToken })
    .reply(HttpStatus.OK, { access_token: validAccessToken });

    // when
    const promise = getTokenInfo(`${oAuthServerHost}${tokenInfoEndpoint}`, validAccessToken);

    // then
    return expect(promise).to.become({ access_token: validAccessToken });
  });
});
