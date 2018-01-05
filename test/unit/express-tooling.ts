import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware
} from '../../src';

import { PrecedenceOptions } from '../../src/types';

chai.use(chaiAsPromised);
chai.use(sinonChai);
let expect = chai.expect;

describe('express tooling', () => {

  let requestMock: any;
  let responseMock: any;
  let next: () => void;
  const loggerMock = undefined;

  before(() => {

    requestMock = {
      get: (name: string) => name
    };
  });

  beforeEach(() => {
    next = sinon.spy();

    responseMock = {};
    responseMock.sendStatus = sinon.spy((status: string) => undefined);
  });

  describe('requireScopesMiddleware', () => {

    it('should reject request with 403 if required scopes are not met', (done) => {

        // given
        requestMock.$$tokeninfo = {
          scope: ['uid', 'test']
        };
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
      requestMock.$$tokeninfo = {
        scope: ['uid', 'test']
      };
      const requiredScopes = ['uid', 'test', 'additional'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should call #next if required scopes are met', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid', 'test']
      };
      const requiredScopes = ['uid', 'test'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next also if user has a superset of the required scopes', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid', 'test', 'additionalScope']
      };
      const requiredScopes = ['uid', 'test'];

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next if precedence function returns true', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid']
      };
      const requiredScopes = ['test'];

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(true);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should not call #next if precedence function returns false and scopes do not match', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid']
      };
      const requiredScopes = ['test'];

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should not fail if precedence function returns false and precedence error handler is undefined', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['uid']
      };
      const requiredScopes = ['uid'];

      const preOptions = {
        precedenceFunction: () => {
          return Promise.reject(false);
        }
      } as any as PrecedenceOptions;

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call #next if precedence function returns false and scopes matches', (done) => {

      // given
      requestMock.$$tokeninfo = {
        scope: ['test']
      };
      const requiredScopes = ['test'];

      const preOptions = {
        precedenceFunction: () => {
          return Promise.resolve(false);
        },
        precedenceErrorHandler: () => { return; }
      };

      // when
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

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
      requestMock.$$tokeninfo = {
        scope: ['test']
      };
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
      requireScopesMiddleware(requiredScopes, loggerMock, preOptions)(requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should call precedence error handler', (done) => {

      // given
      const requiredScopes = ['test'];

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

    it('should call #next on public endpoint', (done) => {

      // given
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
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should not call #next when non-public endpoint', (done) => {

      // given
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
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should not call #next when no token is provided', (done) => {

      // given
      const config = {
        publicEndpoints: [ '/public', '/healthcheck' ],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const _requestMock = Object.assign({}, {
        originalUrl: '/privateAPI',
        headers: { authorization: ['auth1'] }
       }, requestMock);

      // when
      handleOAuthRequestMiddleware(config)(_requestMock, responseMock, next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });
  });
});
