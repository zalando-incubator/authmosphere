import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as mockTooling from '../../src/mock-tooling';
import { MockOptions } from '../../src/types';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('mock-tooling', () => {
  describe('mockAccessTokenEndpoint', () => {
    it('should throw error, if url is empty', () => {
      return expect(() => mockTooling.mockAccessTokenEndpoint({ url: '', auth: ''} as MockOptions)).to.throw(Error);
    });
  });

  describe('mockTokeninfoEndpoint', () => {
    it('should throw error, if url is empty', () => {
      return expect(() => mockTooling.mockTokeninfoEndpoint({ url: ''} as MockOptions)).to.throw(Error);
    });
  });
});
