import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as mockTooling from '../../src/mock-tooling';
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
      return expect(() => mockTooling.mockAccessTokenEndpoint({ url: '' })).to.throw(Error);
    });
  });

  describe('mockTokeninfoEndpoint', () => {
    it('should throw error, if url is empty', () => {
      return expect(() => mockTooling.mockTokeninfoEndpoint({ url: '' })).to.throw(Error);
    });
  });

  describe('mockAccessTokenEndpointWithErrorResponse', () => {
    it('should throw error, if url is empty', () => {
      return expect(() =>
        mockTooling.mockAccessTokenEndpointWithErrorResponse({ url: '' }, HttpStatus.BAD_REQUEST)).to.throw(Error);
    });

    it('should return specified/configured status code and response body', () => {
      const url = 'https://www.github.com';
      const expectedState = HttpStatus.BAD_REQUEST;
      const errorMessage = { err: 'Strange things happend' };
      mockTooling.mockAccessTokenEndpointWithErrorResponse({ url }, expectedState, errorMessage);

      const result = fetch(url, { method: 'POST' })
        .then((response) => {
          expect(response.status).to.equal(expectedState);
          return response.json();
        });
      return expect(result).to.become(errorMessage);
    });

    it('should return specified/configured status code and empty response body, if no response body is defined', () => {
      const url = 'https://www.github.com';
      const expectedState = HttpStatus.BAD_REQUEST;
      mockTooling.mockAccessTokenEndpointWithErrorResponse({ url }, expectedState);

      const result = fetch(url, { method: 'POST' })
        .then((response) => {
          expect(response.status).to.equal(expectedState);
          return response.json();
        });
      return expect(result).to.become({});
    });
  });

  describe('mockTokeninfoEndpointWithErrorResponse', () => {
    it('should throw error, if url is empty', () => {
      return expect(() =>
        mockTooling.mockTokeninfoEndpointWithErrorResponse({ url: '' }, HttpStatus.BAD_REQUEST)).to.throw(Error);
    });

    it('should return specified/configured status code and response body', () => {
      const url = 'https://www.github.com';
      const expectedState = HttpStatus.BAD_REQUEST;
      const errorMessage = { err: 'Stranger things happend' };
      mockTooling.mockTokeninfoEndpointWithErrorResponse({ url }, expectedState, errorMessage);

      const result = fetch(url, { method: 'POST' })
        .then((response) => {
          expect(response.status).to.equal(expectedState);
          return response.json();
        });
      return expect(result).to.become(errorMessage);
    });

    it('should return specified/configured status code and empty response body, if no response body is defined', () => {
      const url = 'https://www.github.com';
      const expectedState = HttpStatus.BAD_REQUEST;
      mockTooling.mockTokeninfoEndpointWithErrorResponse({ url }, expectedState);

      const result = fetch(url, { method: 'POST' })
        .then((response) => {
          expect(response.status).to.equal(expectedState);
          return response.json();
        });
      return expect(result).to.become({});
    });
  });
});
