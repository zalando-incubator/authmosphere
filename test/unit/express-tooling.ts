import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
} from '../../src/index';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('oauth tooling', () => {

  let requestMock: any;
  let responseMock: any;

  before(() => {

    requestMock = {};

    responseMock = {};
    responseMock.sendStatus = function(status: string) {
      this.status = status;
    };
  });



  describe('requireScopesMiddleware', () => {

    it('should reject request with 403 if required scopes are not met', () => {

        // given
        requestMock.scopes = ['uid', 'test'];
        const requiredScopes = ['uid', 'test', 'additional'];
        let called = false;
        let next = () => {
          called = true;
        };

        // when
        requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

        // then
        expect(called).to.be.false;
        expect(responseMock.status).to.equal(403);
      });

    it('should call #next if required scopes are met', () => {

      // given
      requestMock.scopes = ['uid', 'test'];
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      expect(called).to.be.true;
    });

    it('should call #next also if user has a superset of the required scopes', () => {

      // given
      requestMock.scopes = ['uid', 'test', 'additionalScope'];
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      expect(called).to.be.true;
    });
  });

  describe('handleOAuthRequestMiddleware', () => {

    it('should call #next on public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      })({ 'originalUrl': '/healthcheck' }, responseMock, next);

      // then
      expect(called).to.be.true;
    });

    it('should not call #next when non-public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      })({ 'originalUrl': '/privateAPI', headers: {} }, responseMock, next);

      // then
      expect(called).to.be.false;
    });
  });
});
