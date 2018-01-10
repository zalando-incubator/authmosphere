import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  PrecedenceOptions
} from '../../src';
import { Response, Request } from 'express';

chai.use(chaiAsPromised);
chai.use(sinonChai);
let expect = chai.expect;

describe('express tooling', () => {

  const loggerMock = undefined;

  const createRequestMock = (scopes: String[]): Request => ({
    get: (name: string) => name,
    $$tokeninfo: {
      scope: scopes
    }
  } as any as Request);

  const createResponseMock = (): Response => ({
    sendStatus: sinon.spy((status: string) => undefined)
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

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(true);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);

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

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);

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

      const preOptions = {
        precedenceFunction: () => {
          return Promise.reject(false);
        }
      } as any as PrecedenceOptions;

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);

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

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should fallback to normal scope validation', (done) => {

      // if precedence function rejects and precedenceErrorHandler throws

      // given
      const next = sinon.spy();

      const requestMock = createRequestMock(['test']);
      const requiredScopes = ['test'];

      const preOptions = {
        precedenceFunction: () => {
          return Promise.reject(false);
        },
        precedenceErrorHandler: () => {
          throw Error('Expected precedenceErrorHandler throw');
        }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call precedence error handler', (done) => {

      // given
      const next = sinon.spy();
      const requiredScopes = ['test'];

      const requestMock = createRequestMock([]);
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
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, createResponseMock(), next);
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

    it('should call #next on public endpoint', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = Object.assign({}, {
        originalUrl: '/healthcheck',
        headers: {}
      }, createRequestMock([]));

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should not call #next when non-public endpoint', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = Object.assign({}, {
        originalUrl: '/privateAPI',
        headers: {}
      }, createRequestMock([]));

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should not call #next when no token is provided', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = Object.assign({}, {
        originalUrl: '/privateAPI',
        headers: { authorization: ['auth1'] }
      }, createRequestMock([]));

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });
  });
});
