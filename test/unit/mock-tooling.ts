import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as mockTooling from '../../src/mock-tooling';
import { MockOptions } from '../../src/types';
import * as HttpStatus from 'http-status';
import fetch from 'node-fetch';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('mock-tooling', () => {

  beforeEach(() => {
    mockTooling.cleanMock();
  });

  afterEach(() => {
    mockTooling.cleanMock();
  });

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

  describe('mockAccessTokenEndpointWithErrorResponse', () => {
    it('should throw error, if url is empty', () => {
      return expect(() => mockTooling.mockAccessTokenEndpointWithErrorResponse({ url: ''} as MockOptions, HttpStatus.BAD_REQUEST)).to.throw(Error);
    });

    it('should return status code, the mock is configured to use', () => {
      const url = 'https://www.github.com';
      const expectedState = HttpStatus.BAD_REQUEST;
      mockTooling.mockAccessTokenEndpointWithErrorResponse({ url } as MockOptions, expectedState);

      const result = fetch(url, { method: 'POST' })
        .then((data) => data.status);
      return expect(result).to.become(expectedState);
    });
  });

  describe('mockTokeninfoEndpointWithErrorResponse', () => {
    it('should throw error, if url is empty', () => {
      return expect(() => mockTooling.mockTokeninfoEndpointWithErrorResponse({ url: ''} as MockOptions, HttpStatus.BAD_REQUEST)).to.throw(Error);
    });
  });
});
