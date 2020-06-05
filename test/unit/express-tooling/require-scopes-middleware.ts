import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import {
  PrecedenceOptions,
  requireScopesMiddleware,
  ScopeMiddlewareOptions
} from '../../../src';

import { Response, Request } from 'express';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('express tooling', () => {

  const loggerMock = undefined;

  const createRequestMock = (scopes: string[]): Request => ({
    get: (name: string) => name,
    $$tokeninfo: {
      scope: scopes
    }
  } as any as Request);

  const createResponseMock = (): Response => ({
    sendStatus: sinon.spy((status: string) => status)
  } as any as Response);

  describe('requireScopesMiddleware', () => {

    it('should reject request with 403 if required scopes are not met', (done) => {

      // given
      const next = sinon.spy();
      const requestMock = createRequestMock(['uid', 'test']);
      const responseMock = createResponseMock();
      const requiredScopes = ['uid', 'test', 'additional'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        expect(responseMock.sendStatus).to.have.been.calledWith(403);
        done();
      });
    });

    it('should not call next() if required scopes are not met', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid', 'test']);
      const requiredScopes = ['uid', 'test', 'additional'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should call #next if required scopes are met', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid', 'test']);
      const requiredScopes = ['uid', 'test'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next also if user has a superset of the required scopes', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid', 'test', 'additionalScope']);
      const requiredScopes = ['uid', 'test'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next if precedence function returns true', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid']);
      const requiredScopes = ['test'];

      const precedenceOptions = {
        precedenceFunction: () => {
          return Promise.resolve(true);
        }
      };
      const options: ScopeMiddlewareOptions = {
        logger: loggerMock,
        precedenceOptions
      };

      // when
      requireScopesMiddleware(requiredScopes, options)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should not call #next if precedence function returns false and scopes do not match', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid']);
      const requiredScopes = ['test'];

      const precedenceOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        }
      };
      const options: ScopeMiddlewareOptions = {
        logger: loggerMock,
        precedenceOptions
      };

      // when
      requireScopesMiddleware(requiredScopes, options)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should not fail if precedence function returns false and precedence error handler is undefined', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['uid']);
      const requiredScopes = ['uid'];

      const precedenceOptions = {
        precedenceFunction: () => {
          return Promise.reject(false);
        }
      } as any as PrecedenceOptions;

      const options: ScopeMiddlewareOptions = {
        logger: loggerMock,
        precedenceOptions
      };

      // when
      requireScopesMiddleware(requiredScopes, options)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next if precedence function returns false and scopes matches', (done) => {

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['test']);
      const requiredScopes = ['test'];

      const precedenceOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        }
      };

      const options: ScopeMiddlewareOptions = {
        logger: loggerMock,
        precedenceOptions
      };

      // when
      requireScopesMiddleware(requiredScopes, options)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should fallback to normal scope validation', (done) => {

      // if precedence function rejects

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['test']);
      const requiredScopes = ['test'];

      const precedenceOptions = {
        precedenceFunction: () => {
          return Promise.reject(false);
        }
      };

      const options: ScopeMiddlewareOptions = {
        logger: loggerMock,
        precedenceOptions
      };

      // when
      requireScopesMiddleware(requiredScopes, options)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call onAuthorizationFailed handler', (done) => {
      // given
      const next = sinon.spy();

      const middlewareOptions: ScopeMiddlewareOptions = {
        onAuthorizationFailedHandler: sinon.spy()
      };
      const requestMock = createRequestMock(['uid', 'test']);
      const requiredScopes = ['uid', 'test', 'additional'];

      // when
      requireScopesMiddleware(requiredScopes, middlewareOptions)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        // tslint:disable-next-line
        expect(middlewareOptions.onAuthorizationFailedHandler).to.have.been.called;
        done();
      });
    });
  });
});
