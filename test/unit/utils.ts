import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { getFileData, extractAccessToken } from '../../src/utils';

chai.use(chaiAsPromised);
const expect = chai.expect;

const AUTHORIZATION_BEARER_PREFIX = 'Bearer';

describe('utils', () => {
  describe('getFileData', () => {
    it('should ignore tailing / in filepath', () => {
      const promise = Promise.all([
        getFileData('test/unit/credentials', 'user.json'),
        getFileData('test/unit/credentials/', 'user.json')
      ])
      .then((credentials) => {
        return credentials[0] === credentials[1];
        });
      return expect(promise).to.become(true);
    });

    it('should be rejected, if file does not exist', () => {
      const promise = getFileData('test/unit/credentials', 'foo.json');
      return expect(promise).to.be.rejected;
    });
  });

  describe('extractAccessToken', () => {
    it('should return access_token from an authorization header', () => {
      const token = 'token1';
      const header = AUTHORIZATION_BEARER_PREFIX + ' ' + token;
      const result = extractAccessToken(header);
      return expect(result).to.equal(token);
    });

    it('should be rejected, if file does not exist', () => {
      const token = 'token1';
      const header = token;
      const result = extractAccessToken(header);
      return expect(result).to.equal(undefined);
    });
  });
});
