import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  ILogger​​
} from '../../src/index';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('oauth tooling', () => {

  let requestMock: any;
  let responseMock: any;
  const loggerMock = {
    info:  (p: any): void => { return; },
    debug: (p: any): void => { return; },
    error: (p: any): void => { return; },
    fatal: (p: any): void => { return; },
    trace: (p: any): void => { return; },
    warn:  (p: any): void => { return; }
  };

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
        const next = () => {
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
        const next = () => {
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
      const next = () => {
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

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(true);
        },
        precedenceErrorHandler: () => { return; },
        logger: loggerMock
      };

      // when
      requireScopesMiddleware(requiredScopes, preOptions)(requestMock, responseMock, next);

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
      const next = () => {
        called = true;
      };

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; },
        logger: loggerMock
      };

      // when
      requireScopesMiddleware(requiredScopes, preOptions)(requestMock, responseMock, next);

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
      const next = () => {
        called = true;
      };

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; },
        logger: loggerMock
      };

      // when
      requireScopesMiddleware(requiredScopes, preOptions)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });

    it('should call error handler', (done) => {

      // given
      const requiredScopes = ['test'];
      const next = () => {
        return;
      };
      const customErrorhandler = (e: any, logger: ILogger​​): void => {
        // then
        expect(e).to.equal('Error happened');
        done();
      };

      const preOptions = {
        precedenceFunction: () => {
          return Promise.reject('Error happened');
        },
        precedenceErrorHandler: customErrorhandler,
        logger: loggerMock
      };

      // when
      requireScopesMiddleware(requiredScopes, preOptions)(requestMock, responseMock, next);
    });
  });

  describe('handleOAuthRequestMiddleware', () => {

    it('should call #next on public endpoint', () => {

      // given
      let called = false;
      const next = () => {
        called = true;
      };
      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = { originalUrl: '/healthcheck' };

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, responseMock, next);

      // then
      return expect(called).to.be.true;
    });

    it('should not call #next when non-public endpoint', () => {

      // given
      let called = false;
      const next = () => {
        called = true;
      };
      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = { originalUrl: '/privateAPI', headers: {} };

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });
  });
});
