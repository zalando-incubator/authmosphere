import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware
} from '../../src/index';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('express tooling', () => {

  let requestMock: any;
  let responseMock: any;
  const loggerMock = undefined;

  before(() => {

    requestMock = {
      get: (name: string) => name
    };

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

        const next = () => undefined;

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
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

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
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

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
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });

    it('should not call #next nor throw if precedence function rejects and precedenceErrorHandler throws', () => {

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
          return Promise.reject(false);
        },
        precedenceErrorHandler: () => {
          throw Error('Expected precedenceErrorHandler throw');
        }
      };

      // when
      try {
        requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);
      } catch {
        called = true;
      }
      // then
      return expect(called).to.be.false;
    });

    it('should call error handler', (done) => {

      // given
      const requiredScopes = ['test'];
      const next = () => {
        return;
      };
      const customErrorhandler = (e: any​​): void => {
        // then
        expect(e).to.equal('Error happened');
        done();
      };

      const preOptions = {
        precedenceFunction: () => {
          return Promise.reject('Error happened');
        },
        precedenceErrorHandler: customErrorhandler
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);
    });
  });

  describe('handleOAuthRequestMiddleware', () => {

    it('should throw a TypeError, if tokenInfoEndpoint is undefined', () => {
      // given
      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: ''
      };

      // then
      expect(() => { handleOAuthRequestMiddleware(config); }).to.throw(TypeError);
    });

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
      const _requestMock = Object.assign({}, {
        originalUrl: '/healthcheck',
        headers: {}
       }, requestMock);

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
      const _requestMock = Object.assign({}, {
        originalUrl: '/privateAPI',
        headers: {}
       }, requestMock);

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });

    it('should not call #next when no token is provided', () => {

      // given
      let called = false;
      const next = () => {
        called = true;
      };
      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = Object.assign({}, {
        originalUrl: '/privateAPI',
        headers: {authorization: ['auth1']}
       }, requestMock);

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, responseMock, next);

      // then
      return expect(called).to.be.false;
    });
  });
});
