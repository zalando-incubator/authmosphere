import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware
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
        requestMock.$$tokeninfo = {
          scope: ['uid', 'test']
        };
        const requiredScopes = ['uid', 'test', 'additional'];
        let called = false;
        let next = () => {
          called = true;
        };

        // when
        requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

        // then
        return expect(responseMock.status).to.equal(403);
      });

    it('should not call next() if required scopes are not met', () => {

        // given
        requestMock.$$tokeninfo = {
          scope: ['uid', 'test']
        };
        const requiredScopes = ['uid', 'test', 'additional'];
        let called = false;
        let next = () => {
          called = true;
        };

        // when
        requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

        // then
        return expect(called).to.be.false;
      });

    it('should call #next if required scopes are met', () => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid', 'test']
      };
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.true;
    });

    it('should call #next also if user has a superset of the required scopes', () => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid', 'test', 'additionalScope']
      };
      const requiredScopes = ['uid', 'test'];
      let called = false;
      const next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.true;
    });

    it('should call #next if precedence function returns true', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid']
      };
      const requiredScopes = ['test'];
      const next = () => {
        done();
      };

      const preFun = () => {
        return Promise.resolve(true);
      };

      // when
      requireScopesMiddleware(requiredScopes, preFun)(requestMock, responseMock, next);

      // then
      // We wait for the done call here this we get no async handler back on that we can wait
    });

    it('should not call #next if precedence function returns false and scopes do not match', () => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid']
      };
      const requiredScopes = ['test'];
      let called = false;
      let next = () => {
        called = true;
      };

      const preFun = () => {
        return Promise.resolve(false);
      };

      // when
      requireScopesMiddleware(requiredScopes, preFun)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });

    it('should not call #next if precedence function returns false and scopes matches', () => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['test']
      };
      const requiredScopes = ['test'];
      let called = false;
      let next = () => {
        called = true;
      };

      const preFun = () => {
        return Promise.resolve(false);
      };

      // when
      requireScopesMiddleware(requiredScopes, preFun)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
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
      return expect(called).to.be.true;
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
      return expect(called).to.be.false;
    });
  });
});
